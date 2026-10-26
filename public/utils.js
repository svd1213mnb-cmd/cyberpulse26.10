// ==========================================
// utils.js - ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

// 1. Защита от XSS-атак (превращает опасные HTML-теги в обычный текст)
window.escapeHtml = function (str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 2. Всплывающие уведомления (тосты)
window.toast = function (msg, type = "info", duration = 3500) {
  const container = document.getElementById("toastContainer");
  if (!container) return alert(msg);

  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : type === "success" ? "success" : ""}`;
  el.textContent = msg;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, duration);
};

// 3. Форматирование времени (ЧЧ:ММ)
window.formatTime = function (ts) {
  return new Date(ts || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 4. Генерация уникального ID
window.uid = function () {
  return (
    "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
};
// ==========================================
// СОХРАНЕНИЕ И ЗАГРУЗКА СОСТОЯНИЯ
// ==========================================

// Единый ключ для всего приложения
const LS_STATE_KEY = "cyberPulseState_v2";

// Сохранение
window.saveState = function () {
  const toSave = {
    currentUser: state.currentUser,
    activeChatId: state.activeChatId,
    chats: state.chats,
    messages: state.messages,
    stories: state.stories,
    viewedStories: state.viewedStories,
    pinned: state.pinned,
  };
  try {
    localStorage.setItem(LS_STATE_KEY, JSON.stringify(toSave));
    console.log("💾 Состояние сохранено в localStorage");
  } catch (e) {
    console.warn("Ошибка сохранения (возможно, переполнен кэш):", e);
  }
};

// Загрузка
window.loadState = function () {
  try {
    const saved = localStorage.getItem(LS_STATE_KEY);
    if (saved) {
      console.log("📂 Состояние загружено из localStorage");
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Ошибка загрузки состояния:", e);
  }
  return null;
};
