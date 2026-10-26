from sqlmodel import SQLModel, create_engine, Session

# Файл базы данных будет создан автоматически
sqlite_url = "sqlite:///./cyber_pulse.db"
connect_args = {"check_same_thread": False}

engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
        