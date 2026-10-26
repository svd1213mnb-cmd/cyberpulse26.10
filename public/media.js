// media.js

/* ==========================================================================
   РАБОТА С МЕДИА (IndexedDB и просмотр)
   ========================================================================== */

const IDB_NAME = "CyberPulseMedia";
let idb = null;

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("blobs"))
        req.result.createObjectStore("blobs");
    };
    req.onsuccess = () => {
      idb = req.result;
      resolve(idb);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, blob) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction("blobs", "readonly");
    const req = tx.objectStore("blobs").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbDelete(key) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction("blobs", "readwrite");
    tx.objectStore("blobs").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadMediaInto(el, mediaId, kind) {
  try {
    const blob = await idbGet(mediaId);
    if (blob) {
      const url = URL.createObjectURL(blob);
      el.src = url;
      if (kind === "video" && el.tagName === "VIDEO" && el.loop)
        el.play().catch(() => {});
    }
  } catch (e) {
    console.warn("media load fail", e);
  }
}

// Просмотр медиа на весь экран (если у тебя была такая функция)
function openMediaViewer(mediaId, type) {
  // Если у тебя уже есть HTML для просмотра (модалка), добавь его вызов сюда.
  // Пока просто выводим в консоль, чтобы ничего не сломалось.
  console.log("Открытие медиа:", mediaId, type);
}

// === ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ ФАЙЛОВ ===
window.openIDB = openIDB;
window.idbPut = idbPut;
window.idbGet = idbGet;
window.loadMediaInto = loadMediaInto;
window.openMediaViewer = openMediaViewer;
window.idbDelete = idbDelete;
// ==========================================
// СЖАТИЕ ИЗОБРАЖЕНИЙ ПЕРЕД ОТПРАВКОЙ
// ==========================================
window.compressImage = function (
  file,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8,
) {
  return new Promise((resolve, reject) => {
    // Если это не картинка — возвращаем как есть
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      // Вычисляем новые пропорции
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Превращаем холст в сжатый JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Ошибка сжатия"));

          // Создаем новый файл из сжатого blob
          const newFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          console.log(
            `🗜️ Сжатие: ${(file.size / 1024).toFixed(0)} КБ -> ${(newFile.size / 1024).toFixed(0)} КБ`,
          );
          resolve(newFile);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = (err) => reject(err);
    img.src = url;
  });
};
// ==========================================
// ОЧИСТКА СТАРЫХ МЕДИАФАЙЛОВ ИЗ IndexedDB
// ==========================================
window.cleanupOldMedia = async function () {
  // Устанавливаем срок хранения: 30 дней (в миллисекундах)
  const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let deletedCount = 0;

  if (!window.state || !window.state.messages) return;

  // Проходимся по всем чатам
  for (const chatId in window.state.messages) {
    const messages = window.state.messages[chatId];

    for (const msg of messages) {
      // Если у сообщения есть медиафайл и оно старше 30 дней
      if (msg.media && msg.media.id && msg.timestamp) {
        if (now - msg.timestamp > MAX_AGE_MS) {
          try {
            // Удаляем сам файл из IndexedDB
            await idbDelete(msg.media.id);

            // Заменяем данные о файле на заглушку (чтобы сообщение не сломалось)
            msg.media = { type: "deleted", name: "Файл удален" };
            deletedCount++;
          } catch (e) {
            console.warn("Не удалось удалить медиафайл", msg.media.id, e);
          }
        }
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`🧹 Очистка: удалено ${deletedCount} старых медиафайлов.`);
    if (window.saveState) window.saveState(); // Сохраняем обновленное состояние
    // Если открыт чат, где были удалены файлы, перерисовываем его
    if (window.renderMessages) window.renderMessages(true);
  } else {
    console.log("🧹 Очистка: старых файлов для удаления нет.");
  }
};
