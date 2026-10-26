from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import uvicorn
import sqlite3
import json
import time
import os
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- НАСТРОЙКА ЗАГРУЗКИ ФАЙЛОВ ---
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{int(time.time() * 1000)}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://127.0.0.1:8000/uploads/{file_name}"}

# Словарь для хранения активных подключений {username: WebSocket}
active_connections = {}

# --- НАСТРОЙКИ АВТОРИЗАЦИИ ---
SECRET_KEY = "cyber_pulse_super_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Токен живет 7 дней

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError as e:  # <-- ИСПРАВЛЕНО (добавлено as e)
        print(f"❌ ОШИБКА ТОКЕНА: {e}")
        return None

# --- МОДЕЛИ ЗАПРОСОВ ---
class UserAuth(BaseModel):
    username: str
    password: str

# --- РАБОТА С БАЗОЙ ДАННЫХ ---
def init_db():
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                                  (id TEXT PRIMARY KEY, chatId TEXT, sender TEXT, text TEXT, timestamp INTEGER, secret INTEGER, expiresAt INTEGER, media TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (username TEXT PRIMARY KEY, hashed_password TEXT)''')
    conn.commit()
    conn.close()

def save_message(msg):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    msg_id = msg.get('id', str(int(time.time() * 1000)))
    chat_id = msg.get('chatId', 'global')
    sender = msg.get('sender', 'Unknown')
    text = msg.get('text', '')
    timestamp = msg.get('timestamp', int(time.time() * 1000))
    secret = 1 if msg.get('secret') else 0
    expires_at = msg.get('expiresAt', None)
    
    media_data = json.dumps(msg.get('media')) if msg.get('media') else None
    
    c.execute("INSERT OR REPLACE INTO messages VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              (msg_id, chat_id, sender, text, timestamp, secret, expires_at, media_data))
    conn.commit()
    conn.close()

def get_messages(chat_id, limit=50, before_id=None):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    
    # 🧹 УДАЛЯЕМ ПРОСРОЧЕННЫЕ СООБЩЕНИЯ
    now_ms = int(time.time() * 1000)
    c.execute("DELETE FROM messages WHERE expiresAt IS NOT NULL AND expiresAt < ?", (now_ms,))
    conn.commit()
    
    if before_id:
        # ИЩЕМ СТАРЫЕ СООБЩЕНИЯ (Бесконечный скролл)
        c.execute("""
            SELECT id, sender, text, timestamp, secret, expiresAt, media 
            FROM messages 
            WHERE chatId = ? AND CAST(id AS INTEGER) < CAST(? AS INTEGER)
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (chat_id, before_id, limit))
    else:
        # ИЩЕМ ПОСЛЕДНИЕ 50 СООБЩЕНИЙ (Обычная загрузка)
        c.execute("""
            SELECT id, sender, text, timestamp, secret, expiresAt, media 
            FROM messages 
            WHERE chatId = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (chat_id, limit))
    
    rows = c.fetchall()
    conn.close()
    
    rows.reverse() # Переворачиваем, чтобы старые были сверху
    
    return [{
        "id": r[0], 
        "chatId": chat_id, 
        "sender": r[1], 
        "text": r[2], 
        "timestamp": r[3], 
        "secret": bool(r[4]),
        "expiresAt": r[5],
        "media": json.loads(r[6]) if r[6] else None 
    } for r in rows]

@app.post("/register")
def register(user: UserAuth):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    hashed_pw = get_password_hash(user.password)
    c.execute("INSERT INTO users (username, hashed_password) VALUES (?, ?)", (user.username, hashed_pw))
    conn.commit()
    conn.close()
    return {"message": "Успешная регистрация"}

@app.post("/login")
def login(user: UserAuth):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT hashed_password FROM users WHERE username = ?", (user.username,))
    row = c.fetchone()
    conn.close()
    
    if not row or not verify_password(user.password, row[0]):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"} 

@app.get("/search_user/{username}")
def search_user(username: str):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT username FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return {"exists": True, "username": user[0]}
    raise HTTPException(status_code=404, detail="Пользователь не найден")    

# --- ЗАЩИЩЕННЫЙ WEBSOCKET ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    username = decode_token(token)
    if not username:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await websocket.accept()
    
    active_connections[username] = websocket
    print(f"[СЕТЬ] Пользователь {username} подключился к WebSocket")
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action")
            
            # --- 1. ЗВОНКИ ---
            if action in ["call_offer", "call_answer", "ice_candidate", "call_declined", "call_ended"]:
                target_user = msg.get("to")
                if target_user in active_connections:
                    target_ws = active_connections[target_user]
                    forward_msg = {"action": action, "from": username, "data": msg.get("data")}
                    await target_ws.send_text(json.dumps(forward_msg))
                else:
                    await websocket.send_text(json.dumps({"action": "call_error", "message": f"Пользователь {target_user} не в сети"}))
                continue 
            
            # --- 2. ПЕЧАТАЕТ... ---
            elif action == "typing":
                typing_signal = {"type": "typing", "sender": username, "chatId": msg.get("chatId")}
                for user, connection in list(active_connections.items()):
                    if user != username:
                        try:
                            await connection.send_text(json.dumps(typing_signal))
                        except Exception:
                            pass
                continue

                        # --- 3. ИСТОРИЯ ---
            elif action == "get_history":
                chat_id = msg["chatId"]
                limit = msg.get("limit", 50)
                before_id = msg.get("beforeId") # Получаем ID самого верхнего сообщения
                
                # Передаем before_id в функцию
                history = get_messages(chat_id, limit=limit, before_id=before_id)
                await websocket.send_text(json.dumps({"type": "history", "data": history}))
            # --- 4. ОБЫЧНОЕ СООБЩЕНИЕ ---
            else:
                actual_msg = msg.get("data", msg)
                
                if "id" not in actual_msg:
                    actual_msg["id"] = str(int(time.time() * 1000))
                
                save_message(actual_msg)
                
                response_data = {
                    "type": "new_message",
                    "data": actual_msg
                }
                
                chat_id = actual_msg.get("chatId", "global")
                
                if chat_id.startswith("dm-"):
                    parts = chat_id.replace("dm-", "").split("_")
                    if len(parts) == 2:
                        user1, user2 = parts
                        if user1 in active_connections:
                            await active_connections[user1].send_text(json.dumps(response_data))
                        if user2 in active_connections:
                            await active_connections[user2].send_text(json.dumps(response_data))
                else:
                    for user, connection in list(active_connections.items()): 
                        try:
                            await connection.send_text(json.dumps(response_data))
                        except Exception:
                            if user in active_connections:
                                del active_connections[user]
                        
    except WebSocketDisconnect:
        if username in active_connections:
            del active_connections[username]
        print(f"[СЕТЬ] Пользователь {username} отключился")

init_db()        

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)