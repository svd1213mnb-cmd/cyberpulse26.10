// ==========================================
// auth.js - АВТОРИЗАЦИЯ
// ==========================================

window.initAuth = function () {
  const authScreen = document.getElementById("auth-screen");
  const authForm = document.getElementById("auth-form");
  const authUsername = document.getElementById("auth-username");
  const authPassword = document.getElementById("auth-password");
  const authError = document.getElementById("auth-error");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authToggleBtn = document.getElementById("auth-toggle-btn");
  const authSubtitle = document.getElementById("auth-subtitle");

  let isLoginMode = true;

  if (!authForm) return; // Если формы нет, выходим

  // Переключение между Входом и Регистрацией
  authToggleBtn?.addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    authSubtitle.innerText = isLoginMode
      ? "Авторизация в сети"
      : "Создание нового узла";
    authSubmitBtn.innerText = isLoginMode
      ? "ВОЙТИ В СИСТЕМУ"
      : "ЗАРЕГИСТРИРОВАТЬСЯ";
    authToggleBtn.innerHTML = isLoginMode
      ? 'Нет доступа? <span class="font-bold underline decoration-cyan-500 underline-offset-4">Запросить регистрацию</span>'
      : 'Уже есть доступ? <span class="font-bold underline decoration-cyan-500 underline-offset-4">Войти в систему</span>';
    authError.classList.add("hidden");
  });

  // Отправка формы
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = authUsername.value.trim();
    const password = authPassword.value;
    const url = isLoginMode
      ? "http://127.0.0.1:8000/login"
      : "http://127.0.0.1:8000/register";

    authSubmitBtn.innerText = "ПОДКЛЮЧЕНИЕ...";
    authSubmitBtn.disabled = true;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLoginMode) {
          console.log("✅ 1. Токен получен от сервера");
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("username", username);
          window.state.currentUser = username;

          const authScreen = document.getElementById("auth-screen");
          if (authScreen) authScreen.classList.add("hidden");

          console.log("✅ 2. Запускаем WebSocket...");
          if (window.connectWebSocket)
            window.connectWebSocket(data.access_token);
        } else {
          alert("Узел создан! Теперь войдите.");
          authToggleBtn.click();
        }
      } else {
        authError.innerText = data.detail || "Ошибка авторизации";
        authError.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Ошибка сервера:", error);
      authError.innerText = "Сервер недоступен. Запущен ли Python?";
      authError.classList.remove("hidden");
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.innerText = isLoginMode
        ? "ВОЙТИ В СИСТЕМУ"
        : "ЗАРЕГИСТРИРОВАТЬСЯ";
    }
  });
};
