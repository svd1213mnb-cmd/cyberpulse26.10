// ==========================================
// stories.js - Логика историй (Stories)
// ==========================================

// 1. Функция загрузки своей истории
window.triggerStoryUpload = function () {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*,video/*"; // Разрешаем фото и видео

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка на размер (максимум 5 МБ)
    if (file.size > 5 * 1024 * 1024) {
      if (typeof toast === "function") toast("Максимум 5 МБ", "error");
      return;
    }

    // Генерируем уникальный ID
    const mediaId = typeof uid === "function" ? uid() : Date.now().toString();

    // Если используешь IndexedDB, сохраняем туда (чтобы не пропало при F5)
    if (typeof idbPut === "function") {
      await idbPut(mediaId, file);
    }

    // Создаем ссылку для отображения
    const mediaUrl = URL.createObjectURL(file);

    // Добавляем в общий массив state
    state.stories.unshift({
      id: mediaId,
      author: state.currentUser || "Я",
      mediaUrl: mediaUrl,
      type: file.type.startsWith("video") ? "video" : "image",
      createdAt: Date.now(), // ВАЖНО: Время создания для фильтрации
    });

    // Перерисовываем ленту
    window.renderStories();
    if (typeof toast === "function") toast("История добавлена!", "success");
  };

  fileInput.click();
};

// 2. Функция отрисовки ленты историй
window.renderStories = function () {
  const container = document.getElementById("storiesContainer");
  if (!container) return;

  container.innerHTML = ""; // Очищаем контейнер

  // Фильтруем истории: оставляем только те, что моложе 24 часов
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const activeStories = (state.stories || []).filter(
    (s) => now - (s.createdAt || now) < ONE_DAY_MS,
  );

  // Делим на "Мои" и "Чужие"
  const myStories = activeStories.filter((s) => s.author === state.currentUser);
  const otherStories = activeStories.filter(
    (s) => s.author !== state.currentUser,
  );

  // --- 1. ТВОЙ КРУЖОК (Первый) ---
  let myStoryHTML = "";
  if (myStories.length > 0) {
    // Если есть своя история - показываем последнюю
    const latest = myStories[0];
    myStoryHTML = `
            <div class="flex flex-col items-center cursor-pointer flex-shrink-0 relative">
                <div class="w-14 h-14 rounded-full border-2 border-cyan-500 p-[2px] hover:scale-105 transition" onclick="window.openStory('${latest.id}')">
                    <div class="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img src="${latest.mediaUrl}" class="w-full h-full object-cover">
                    </div>
                </div>
                <!-- Маленький плюсик, чтобы добавить еще -->
                <div class="absolute bottom-4 right-0 bg-cyan-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-slate-950 hover:bg-cyan-400" onclick="event.stopPropagation(); window.triggerStoryUpload()">
                    +
                </div>
                <span class="text-[10px] text-slate-300 mt-1 w-14 text-center truncate">Моя</span>
            </div>
        `;
  } else {
    // Если истории нет - показываем плюсик
    myStoryHTML = `
            <div class="flex flex-col items-center cursor-pointer flex-shrink-0" onclick="window.triggerStoryUpload()">
                <div class="w-14 h-14 rounded-full border-2 border-dashed border-cyan-500 flex items-center justify-center bg-slate-900 hover:bg-slate-800 transition">
                    <span class="text-cyan-400 text-xl font-bold">+</span>
                </div>
                <span class="text-[10px] text-slate-400 mt-1">Моя</span>
            </div>
        `;
  }
  container.insertAdjacentHTML("beforeend", myStoryHTML);

  // --- 2. ЧУЖИЕ ИСТОРИИ ---
  if (otherStories.length > 0) {
    otherStories.forEach((story) => {
      const firstLetter = story.author
        ? story.author.charAt(0).toUpperCase()
        : "?";
      const storyHTML = `
                <div class="flex flex-col items-center cursor-pointer flex-shrink-0" onclick="window.openStory('${story.id}')">
                    <div class="w-14 h-14 rounded-full border-2 border-cyan-500 p-[2px] hover:scale-105 transition">
                        <div class="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold overflow-hidden">
                            ${story.mediaUrl ? `<img src="${story.mediaUrl}" class="w-full h-full object-cover">` : firstLetter}
                        </div>
                    </div>
                    <span class="text-[10px] text-slate-300 mt-1 truncate w-14 text-center">${story.author || "User"}</span>
                </div>
            `;
      container.insertAdjacentHTML("beforeend", storyHTML);
    });
  }
};

// 3. Открытие модального окна просмотра
window.openStory = function (storyId) {
  // Ищем историю в общем массиве
  const story = state.stories.find((s) => s.id === storyId);
  if (!story) return;

  // Находим элементы твоей HTML-модалки
  const modal = document.getElementById("storyViewerModal");
  const imgEl = document.getElementById("storyImage");
  const videoEl = document.getElementById("storyVideo");
  const authorEl = document.getElementById("storyAuthor");
  const progressContainer = document.getElementById("storyProgressBars");

  if (!modal) return;

  // Устанавливаем имя автора
  if (authorEl) authorEl.innerText = story.author || "Неизвестный";

  // Очищаем и создаем полоску прогресса
  if (progressContainer) {
    progressContainer.innerHTML = `<div class="h-1 bg-cyan-500 rounded-full w-0 transition-all duration-[5000ms] ease-linear" id="activeProgress"></div>`;
  }

  // Показываем видео или картинку
  if (story.type === "video") {
    if (imgEl) imgEl.classList.add("hidden");
    if (videoEl) {
      videoEl.classList.remove("hidden");
      videoEl.src = story.mediaUrl;
      videoEl.play();
    }
  } else {
    if (videoEl) {
      videoEl.classList.add("hidden");
      videoEl.pause();
    }
    if (imgEl) {
      imgEl.classList.remove("hidden");
      imgEl.src = story.mediaUrl;
    }
  }

  // Открываем модалку
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Запускаем анимацию полоски прогресса
  setTimeout(() => {
    const activeProgress = document.getElementById("activeProgress");
    if (activeProgress) {
      activeProgress.classList.remove("w-0");
      activeProgress.classList.add("w-full");
    }
  }, 50);

  // Автоматическое закрытие через 5 секунд
  window.storyTimeout = setTimeout(() => {
    window.closeStoryViewer();
  }, 5000);
};

// 4. Закрытие модального окна
window.closeStoryViewer = function () {
  const modal = document.getElementById("storyViewerModal");
  const videoEl = document.getElementById("storyVideo");

  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  // Останавливаем видео, если оно играло
  if (videoEl) {
    videoEl.pause();
  }

  // Очищаем таймер
  clearTimeout(window.storyTimeout);
};

// Привязываем кнопку закрытия (крестик) к нашей функции
document
  .getElementById("closeStoryBtn")
  ?.addEventListener("click", window.closeStoryViewer);
// Оставляем только те, что моложе 24 часов И имеют картинку/видео
const activeStories = state.stories.filter(
  (s) => now - (s.createdAt || now) < ONE_DAY_MS && s.mediaUrl,
);
