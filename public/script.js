// --- ПОДКЛЮЧЕНИЕ К PYTHON WEBSOCKET ---

const messageFeedEl = document.getElementById("messageFeed");
// Дефолтные данные при первом запуске
const defaultChats = [
  { id: "global", name: "# matrix-global", type: "channel", unread: 0 },
  { id: "dev-node", name: "# dev-talk", type: "channel", unread: 0 },
  { id: "dm-ghost", name: "Ghost_Zero", type: "dm", unread: 0 },
];

const defaultMessages = {
  global: [
    {
      id: "m1",
      sender: "System",
      text: "Node matrix stream initialized.",
      timestamp: Date.now() - 600000,
      isSelf: false,
      reactions: {},
    },
    {
      id: "m2",
      sender: "Ghost_Zero",
      text: "Greetings operator.",
      timestamp: Date.now() - 480000,
      isSelf: false,
      reactions: {},
    },
  ],
  "dev-node": [
    {
      id: "m3",
      sender: "DevCore",
      text: "WebRTC ready.",
      timestamp: Date.now() - 900000,
      isSelf: false,
      reactions: {},
    },
  ],
  "dm-ghost": [
    {
      id: "m4",
      sender: "Ghost_Zero",
      text: "Check voice stage.",
      timestamp: Date.now() - 300000,
      isSelf: false,
      reactions: {},
    },
  ],
};

const defaultStories = [];
let state = {
  currentUser: localStorage.getItem("username") || "Unknown",
  activeChatId: "global",
  selectedMessageForContext: null,
  replyTo: null,
  chats: defaultChats,
  messages: defaultMessages,
  stories: defaultStories,
  viewedStories: [],
  pinned: null,
  pendingAttachment: null,
  secretMode: false,
  searchMatches: [],
  searchIndex: -1,
};
window.currentChatTab = "channel";
window.state = state;
// ❗ ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ ПРИ ЗАГРУЗКЕ
const savedState = window.loadState ? window.loadState() : null;
if (savedState) {
  state.currentUser = savedState.currentUser || state.currentUser;
  state.activeChatId = savedState.activeChatId || "global";
  if (savedState.chats && savedState.chats.length > 0) {
    state.chats = savedState.chats;
  } else {
    state.chats = defaultChats;
  }
  state.messages = savedState.messages || defaultMessages;
  state.stories = savedState.stories || defaultStories;
  state.viewedStories = savedState.viewedStories || [];
  state.pinned = savedState.pinned || null;
  console.log("✅ Данные успешно восстановлены из localStorage");
} else {
  console.log("ℹ️ Сохраненных данных нет, используем значения по умолчанию.");
}

// Защита от дублирования соединений
if (
  window.mySocket &&
  (window.mySocket.readyState === WebSocket.OPEN ||
    window.mySocket.readyState === WebSocket.CONNECTING)
) {
  console.log("Сокет уже активен, пропускаем создание нового.");
}

// ==========================================
// ЛОГИКА АВТОРИЗАЦИИ (Добавляем ее сюда)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  if (window.initAuth) window.initAuth();

  // === ПРОВЕРКА ТОКЕНА ПРИ ЗАГРУЗКЕ ===
  const savedToken = localStorage.getItem("token");

  if (savedToken) {
    console.log("Токен найден, выполняем автовход...");
    ///////отрисовка историй////////////////////

    // Прячем экран входа (переменная authScreen уже объявлена выше)
    const loginScreen = document.getElementById("auth-screen");
    if (loginScreen) loginScreen.classList.add("hidden");

    // Подключаемся к серверу

    if (window.connectWebSocket) {
      window.connectWebSocket(savedToken);
    } else {
      console.error(
        "❌ ОШИБКА: Функция connectWebSocket не загружена из socket.js!",
      );
    }
  }
  // =====================================
  // 2. А теперь, если нужно, очищаем его (хотя если в HTML нет value, он и так пустой)

  // ==========================================
  // ДАЛЬШЕ ИДЕТ ТВОЙ СТАРЫЙ КОД
  // ==========================================
  let currentLang = "ru";
  function t(key) {
    const pack = i18n[currentLang] || i18n.ru;
    return pack[key] || i18n.ru[key] || key;
  }
  function setText(id, key) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
  function setPh(id, key) {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
  }

  function applyLanguage(lang) {
    currentLang = i18n[lang] ? lang : "ru";
    document.documentElement.lang = currentLang;
    setText("storiesTitle", "stories");
    setText("addStoryLabel", "add");
    setText("tabGlobal", "channels");
    setText("tabDM", "dm");
    setPh("chatSearchInput", "searchChats");
    setPh("inChatSearchInput", "searchMsgs");
    setPh("messageInput", "placeholder");
    setPh("aiInput", "aiPlaceholder");
    setText("pinnedPrefix", "pinned");
    setText("replyPrefix", "reply");
    setText("nodeStatus", "node");
    setText("aiTitle", "aiTitle");
    setText("aiSubtitle", "aiSub");
    setText("summarizeChatBtn", "summarize");
    setText("aiAskBtn", "ask");
    setText("settingsTitleText", "settingsTitle");
    setText("labelDisplayName", "displayName");
    setText("labelLanguage", "language");
    setText("labelTheme", "theme");
    setText("labelMatrix", "matrixRain");
    setText("labelMotion", "reducedMotion");
    setText("labelSounds", "sounds");
    setText("labelGemini", "geminiKey");
    setText("labelCrypto", "crypto");
    setText("regenKeysBtn", "regen");
    setText("exportChatsBtn", "exportChats");
    setText("clearAllDataBtn", "clearData");
    setText("ctxReply", "ctxReply");
    setText("ctxReact", "ctxReact");
    setText("ctxPin", "ctxPin");
    setText("ctxCopy", "ctxCopy");
    setText("ctxForward", "ctxForward");
    setText("ctxDelete", "ctxDelete");
    setText("forwardTitle", "forwardTitle");
    setText("cancelForwardBtn", "cancel");
    setText("cancelPollBtn", "cancel");
    setText("submitPollBtn", "launch");
    setPh("pollQuestion", "pollQ");
    setPh("pollOpt1", "opt1");
    setPh("pollOpt2", "opt2");
    const hint = document.getElementById("geminiHint");
    if (hint)
      hint.innerHTML =
        escapeHtml(t("geminiHint")) +
        ' <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-cyan-400">aistudio.google.com</a>';
  }

  // --- Форматирование текста (Markdown) ---
  function formatMessageText(text) {
    let t = escapeHtml(text);
    t = t
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-black/40 px-1 rounded text-cyan-300 font-mono">$1</code>',
      )
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline">$1</a>',
      );
    return t;
  }
  window.formatMessageText = formatMessageText;

  // --- Отрисовка ленты сообщений ---

  // --- Загрузка медиа-файлов из IndexedDB ---
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

  /* ==========================================================================
       7. КОНТЕКСТНОЕ МЕНЮ И РЕАКЦИИ
       ========================================================================== */
  const contextMenu = document.getElementById("contextMenu");
  const quickReactPanel = document.getElementById("quickReactPanel");
  const replyBar = document.getElementById("replyBar");

  // Показать контекстное меню
  function showContextMenu(e, msg) {
    if (!e) return;
    e.preventDefault?.();
    e.stopPropagation?.();
    state.selectedMessageForContext = msg;
    if (!contextMenu) return;

    const x = e.clientX || (e.touches && e.touches[0].clientX) || 100;
    const y = e.clientY || (e.touches && e.touches[0].clientY) || 100;
    contextMenu.style.left = Math.min(x, window.innerWidth - 180) + "px";
    contextMenu.style.top = Math.min(y, window.innerHeight - 220) + "px";
    contextMenu.classList.remove("hidden");
  }

  // Скрыть меню при клике в любом другом месте
  document.addEventListener("click", () => {
    contextMenu?.classList.add("hidden");
    quickReactPanel?.classList.add("hidden");
  });

  // Обработка действий из контекстного меню
  document.querySelectorAll("#contextMenu [data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const msg = state.selectedMessageForContext;
      if (!msg) return;
      contextMenu?.classList.add("hidden");

      if (action === "reply") {
        state.replyTo = msg;
        const ru = document.getElementById("replyToUser");
        if (ru) ru.textContent = msg.sender;
        const rt = document.getElementById("replyToText");
        if (rt) rt.textContent = msg.text || (msg.media ? "[media]" : "");

        // ❗ УБИРАЕМ класс hidden, чтобы панель появилась
        document.getElementById("replyBar")?.classList.remove("hidden");

        document.getElementById("messageInput")?.focus();
      } else if (action === "pin") {
        state.pinned = { text: msg.text || "[media]", id: msg.id };
        const pbc = document.getElementById("pinnedBannerContent");
        if (pbc) pbc.textContent = state.pinned.text;
        document.getElementById("pinnedBanner")?.classList.remove("hidden");
        saveState();
        toast("Закреплено", "success");
      } else if (action === "copy") {
        navigator.clipboard
          .writeText(msg.text || "")
          .then(() => toast(t("copied"), "success"));
      } else if (action === "delete") {
        state.messages[state.activeChatId] = state.messages[
          state.activeChatId
        ].filter((m) => m.id !== msg.id);
        renderMessages();
        saveState();
      } else if (action === "react") {
        if (quickReactPanel) {
          quickReactPanel.style.left = contextMenu.style.left;
          quickReactPanel.style.top =
            parseInt(contextMenu.style.top) - 40 + "px";
          quickReactPanel.classList.remove("hidden");
        }
      } else if (action === "forward") {
        openForwardModal(msg);
      }
    });
  });

  // Отмена ответа
  document.getElementById("cancelReplyBtn")?.addEventListener("click", () => {
    state.replyTo = null;
    document.getElementById("replyBar")?.classList.add("hidden"); // <--- ДОЛЖНО БЫТЬ add
  });

  // Открепить сообщение
  document.getElementById("unpinBtn")?.addEventListener("click", () => {
    state.pinned = null;
    document.getElementById("pinnedBanner")?.classList.add("hidden");
    saveState();
  });

  // Быстрые реакции (из панельки)
  document.querySelectorAll("#quickReactPanel [data-emoji]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const msg = state.selectedMessageForContext;
      if (msg) toggleReaction(msg.id, btn.dataset.emoji);
      quickReactPanel?.classList.add("hidden");
    });
  });

  // Логика переключения реакции
  function toggleReaction(msgId, emoji) {
    const msg = (state.messages[state.activeChatId] || []).find(
      (m) => m.id === msgId,
    );
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const idx = msg.reactions[emoji].indexOf(state.currentUser);
    if (idx >= 0)
      msg.reactions[emoji].splice(idx, 1); // Убрать реакцию
    else msg.reactions[emoji].push(state.currentUser); // Добавить реакцию

    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    renderMessages();
    saveState();
  }

  /* ==========================================================================
       8. ОПРОСЫ (POLLS)
       ========================================================================== */
  document
    .getElementById("createPollBtn")
    ?.addEventListener("click", () =>
      document.getElementById("pollModal")?.classList.remove("hidden"),
    );
  document
    .getElementById("cancelPollBtn")
    ?.addEventListener("click", () =>
      document.getElementById("pollModal")?.classList.add("hidden"),
    );

  document.getElementById("submitPollBtn")?.addEventListener("click", () => {
    const q = document.getElementById("pollQuestion")?.value.trim();
    const o1 = document.getElementById("pollOpt1")?.value.trim();
    const o2 = document.getElementById("pollOpt2")?.value.trim();
    if (!q || !o1 || !o2) {
      toast("Заполните все поля", "error");
      return;
    }

    const msg = {
      id: uid(),
      sender: state.currentUser,
      text: "",
      timestamp: Date.now(),
      isSelf: true,
      reactions: {},
      poll: { question: q, opt1: o1, opt2: o2, v1: 0, v2: 0, voters: {} },
    };
    if (!state.messages[state.activeChatId])
      state.messages[state.activeChatId] = [];
    state.messages[state.activeChatId].push(msg);

    renderMessages(true);
    saveState();
    document.getElementById("pollModal")?.classList.add("hidden");
    document.getElementById("pollQuestion").value = "";
    document.getElementById("pollOpt1").value = "";
    document.getElementById("pollOpt2").value = "";
  });

  function votePoll(msgId, opt) {
    const msg = (state.messages[state.activeChatId] || []).find(
      (m) => m.id === msgId,
    );
    if (!msg || !msg.poll) return;
    if (!msg.poll.voters) msg.poll.voters = {};
    if (msg.poll.voters[state.currentUser]) {
      toast("Вы уже голосовали", "error");
      return;
    }

    msg.poll.voters[state.currentUser] = opt;
    if (opt === 1) msg.poll.v1 = (msg.poll.v1 || 0) + 1;
    else msg.poll.v2 = (msg.poll.v2 || 0) + 1;

    renderMessages();
    saveState();
  }

  /* ==========================================================================
       9. ПОИСК ПО ЧАТУ
       ========================================================================== */
  const chatSearchBox = document.getElementById("chatSearchBox");

  document
    .getElementById("toggleChatSearchBtn")
    ?.addEventListener("click", () => {
      chatSearchBox?.classList.toggle("hidden");
      if (!chatSearchBox?.classList.contains("hidden"))
        document.getElementById("inChatSearchInput")?.focus();
      else clearSearchHighlight();
    });

  document.getElementById("closeSearchBtn")?.addEventListener("click", () => {
    chatSearchBox?.classList.add("hidden");
    clearSearchHighlight();
  });

  function clearSearchHighlight() {
    document.querySelectorAll(".search-highlight").forEach((el) => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    state.searchMatches = [];
    state.searchIndex = -1;
    const src = document.getElementById("searchResultCount");
    if (src) src.textContent = "0";
  }

  function performSearch(query) {
    clearSearchHighlight();
    if (!query || query.length < 1) return;

    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const textNodes = [];
    const walker = document.createTreeWalker(
      messageFeedEl,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );
    let node;

    while ((node = walker.nextNode())) {
      if (
        node.parentElement.closest(".msg-text") ||
        node.parentElement.classList.contains("msg-text")
      )
        textNodes.push(node);
    }

    const matches = [];
    textNodes.forEach((textNode) => {
      const text = textNode.textContent;
      let match;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      re.lastIndex = 0;

      while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex)
          frag.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index)),
          );
        const span = document.createElement("span");
        span.className = "search-highlight";
        span.textContent = match[0];
        frag.appendChild(span);
        matches.push(span);
        lastIndex = re.lastIndex;
      }

      if (lastIndex < text.length)
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      if (matches.length && lastIndex > 0)
        textNode.parentNode.replaceChild(frag, textNode);
    });

    state.searchMatches = matches;
    state.searchIndex = matches.length ? 0 : -1;
    const src = document.getElementById("searchResultCount");
    if (src) src.textContent = matches.length;

    if (matches.length) {
      matches[0].classList.add("current");
      matches[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  document
    .getElementById("inChatSearchInput")
    ?.addEventListener("input", (e) => performSearch(e.target.value.trim()));
  document
    .getElementById("inChatSearchInput")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goSearch(e.shiftKey ? -1 : 1);
      }
    });
  document
    .getElementById("searchNextBtn")
    ?.addEventListener("click", () => goSearch(1));
  document
    .getElementById("searchPrevBtn")
    ?.addEventListener("click", () => goSearch(-1));

  function goSearch(dir) {
    if (!state.searchMatches.length) return;
    state.searchMatches[state.searchIndex]?.classList.remove("current");
    state.searchIndex =
      (state.searchIndex + dir + state.searchMatches.length) %
      state.searchMatches.length;
    const cur = state.searchMatches[state.searchIndex];
    cur.classList.add("current");
    cur.scrollIntoView({ behavior: "smooth", block: "center" });

    const src = document.getElementById("searchResultCount");
    if (src)
      src.textContent = `${state.searchIndex + 1}/${state.searchMatches.length}`;
  }

  /* ==========================================================================
       10. ПЕРЕСЫЛКА СООБЩЕНИЙ (FORWARD)
       ========================================================================== */
  function openForwardModal(msg) {
    const list = document.getElementById("forwardChatList");
    if (!list) return;

    list.innerHTML = state.chats
      .map(
        (c) =>
          `<button data-chat="${c.id}" class="w-full text-left px-3 py-2 rounded hover:bg-cyan-500/20 text-xs">${escapeHtml(c.name)}</button>`,
      )
      .join("");

    list.querySelectorAll("[data-chat]").forEach((btn) => {
      btn.onclick = () => {
        const targetId = btn.dataset.chat;
        if (!state.messages[targetId]) state.messages[targetId] = [];

        // Клонируем сообщение для пересылки
        state.messages[targetId].push({
          ...msg,
          id: uid(),
          isSelf: true,
          sender: state.currentUser,
          timestamp: Date.now(),
          text: msg.text ? `[Forwarded] ${msg.text}` : msg.text,
        });

        document.getElementById("forwardModal")?.classList.add("hidden");
        toast(t("forwarded"), "success");
        saveState();
      };
    });
    document.getElementById("forwardModal")?.classList.remove("hidden");
  }

  document
    .getElementById("cancelForwardBtn")
    ?.addEventListener("click", () =>
      document.getElementById("forwardModal")?.classList.add("hidden"),
    );
  const chatForm = document.getElementById("chatForm");
  const messageInput = document.getElementById("messageInput");
  if (chatForm) {
    // Вспомогательная функция для отмены ответа (оставь её, если она была)
    function cancelReply() {
      state.replyTo = null;
      const replyBar = document.getElementById("replyBar");
      if (replyBar) replyBar.classList.remove("active");
    }
  }
  // ОБЪЕДИНЕННЫЙ ОБРАБОТЧИК ОТПРАВКИ

  /* ==========================================================================
       11. ОТПРАВКА СООБЩЕНИЙ И ВЛОЖЕНИЙ
       ========================================================================== */
  //const chatForm = document.getElementById('chatForm');
  //const messageInput = document.getElementById('messageInput');

  // Вспомогательная функция для отмены ответа
  function cancelReply() {
    state.replyTo = null;
    document.getElementById("replyBar")?.classList.remove("hidden");
  }
  secretMsgBtn;
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("1. ФОРМА НАЖАТА!");

      const inputEl = document.getElementById("messageInput");
      let text = inputEl ? inputEl.value.trim() : "";
      if (!text && inputEl) text = inputEl.value;

      const hasMedia = !!state.pendingAttachment;

      console.log("2. ТЕКСТ В ПОЛЕ:", text);

      if (!text && !hasMedia) {
        console.log("3. ОТМЕНА: ПУСТОЙ ТЕКСТ");
        return;
      }

      // Создаем объект сообщения
      const newMsg = {
        chatId: state.activeChatId,
        sender: state.currentUser,
        text: text,
        timestamp: Date.now(),
        secret: state.secretMode,
        expiresAt: state.secretMode ? Date.now() + 10000 : null,

        // ❗ ВОТ ЭТА СТРОКА ОТВЕЧАЕТ ЗА ФАЙЛ:
        media: state.pendingAttachment
          ? {
              url: state.pendingAttachment.url, // <--- Передаем ссылку на сервер
              type: state.pendingAttachment.type,
              name: state.pendingAttachment.name || "file",
            }
          : null,
      };

      // ВАЖНО: Проверяем, что window.mySocket существует и соединение открыто
      if (
        typeof window.mySocket !== "undefined" &&
        window.mySocket !== null &&
        window.mySocket.readyState === WebSocket.OPEN
      ) {
        window.mySocket.send(
          JSON.stringify({
            action: "send_message",
            data: newMsg,
          }),
        );
        console.log("Сообщение улетело на сервер:", newMsg);

        // Очищаем поле после успешной отправки
        if (inputEl) inputEl.value = "";

        // Сбрасываем вложения и ответы, если они были
        state.pendingAttachment = null;
        cancelReply();
      } else {
        console.warn(
          "WebSocket не подключен! Статус:",
          window.mySocket ? window.mySocket.readyState : "undefined",
        );
      }
    });
  }

  // Прикрепление файлов (ЗАГРУЗКА НА СЕРВЕР)
  document
    .getElementById("fileInput")
    ?.addEventListener("change", async (e) => {
      const originalFile = e.target.files[0];
      if (!originalFile) return;

      if (originalFile.size > 50 * 1024 * 1024) {
        toast("Файл больше 50 МБ", "error");
        e.target.value = "";
        return;
      }

      let fileToSave = originalFile;

      // Сжимаем картинки
      if (originalFile.type.startsWith("image/")) {
        try {
          if (window.compressImage) {
            fileToSave = await window.compressImage(originalFile);
          }
        } catch (err) {
          console.error("Ошибка сжатия, отправляем оригинал:", err);
        }
      }

      // ❗ ОТПРАВЛЯЕМ НА PYTHON-СЕРВЕР
      try {
        if (typeof toast === "function")
          toast("Загрузка файла на сервер...", "info");

        const formData = new FormData();
        formData.append("file", fileToSave);

        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Ошибка сервера при загрузке");
        const data = await response.json();

        // Сохраняем в state ССЫЛКУ на сервер
        state.pendingAttachment = {
          url: data.url, // <--- Теперь здесь ссылка
          type: fileToSave.type.startsWith("image/")
            ? "image"
            : fileToSave.type.startsWith("audio/")
              ? "audio"
              : "file",
          name: fileToSave.name,
          size: fileToSave.size,
        };

        const nameEl = document.getElementById("attachmentName");
        if (nameEl) nameEl.textContent = fileToSave.name;
        document
          .getElementById("attachmentPreview")
          ?.classList.remove("hidden");
        e.target.value = "";

        if (typeof toast === "function")
          toast("Файл готов к отправке", "success");
      } catch (err) {
        console.error(err);
        if (typeof toast === "function")
          toast("Не удалось загрузить файл", "error");
      }
    });

  // Очистка прикрепленного файла (без удаления с сервера)
  document
    .getElementById("clearAttachmentBtn")
    ?.addEventListener("click", () => {
      state.pendingAttachment = null;
      document.getElementById("attachmentPreview")?.classList.add("hidden");
    });
  /* ==========================================================================
       12. ГОЛОСОВЫЕ СООБЩЕНИЯ
       ========================================================================== */
  let mediaRecorder = null,
    recordedChunks = [],
    recordingStart = 0,
    recordingTimerInterval = null,
    recordingMode = null;

  async function startVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });

        if (blob.size < 1000) {
          if (typeof toast === "function")
            toast("Слишком короткая запись", "error");
          return;
        }

        try {
          if (typeof toast === "function")
            toast("Отправка голосового...", "info");

          const formData = new FormData();
          formData.append("file", blob, "voice.webm");

          // 1. Загружаем файл на сервер
          const response = await fetch("http://127.0.0.1:8000/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Ошибка загрузки файла");
          const data = await response.json();

          // 2. Создаем объект сообщения (точно такой же, как при отправке текста)
          const msg = {
            chatId: state.activeChatId, // ❗ ОБЯЗАТЕЛЬНО указываем чат
            id: uid(),
            sender: state.currentUser,
            text: "", // Текста нет, только медиа
            timestamp: Date.now(),
            isSelf: true,
            secret: false,
            expiresAt: null,
            reactions: {},
            media: {
              url: data.url, // Ссылка с сервера
              type: "audio",
              name: "voice.webm",
            },
          };

          // 3. ❗ ОТПРАВЛЯЕМ НА СЕРВЕР ЧЕРЕЗ WEBSOCKET
          if (
            window.mySocket &&
            window.mySocket.readyState === WebSocket.OPEN
          ) {
            window.mySocket.send(
              JSON.stringify({
                action: "send_message",
                data: msg,
              }),
            );

            if (typeof toast === "function")
              toast("Голосовое отправлено!", "success");
          } else {
            if (typeof toast === "function")
              toast("Нет соединения с сервером", "error");
          }
        } catch (err) {
          console.error(err);
          if (typeof toast === "function")
            toast("Не удалось отправить голосовое", "error");
        }
      };
      mediaRecorder.start(200);
      recordingMode = "voice";
      recordingStart = Date.now();

      // UI для записи
      document.getElementById("recordingIndicator")?.classList.add("active");
      const label = document.getElementById("recordingTypeLabel");
      if (label) label.textContent = t("voice") || "Recording...";

      recordingTimerInterval = setInterval(() => {
        const sec = Math.floor((Date.now() - recordingStart) / 1000);
        const el = document.getElementById("recordingTimer");
        if (el)
          el.textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
      }, 200);
    } catch (err) {
      toast("Нет доступа к микрофону.", "error");
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording")
      mediaRecorder.stop();
    document.getElementById("recordingIndicator")?.classList.remove("active");
    clearInterval(recordingTimerInterval);
    recordingMode = null;
  }

  document
    .getElementById("voiceRecordBtn")
    ?.addEventListener("click", startVoiceRecording);
  document
    .getElementById("stopRecordingBtn")
    ?.addEventListener("click", stopRecording);

  /* ==========================================================================
       13. ВИДЕО-КРУЖКИ (ИСПРАВЛЕН БАГ С ДВОЙНЫМ КЛИКОМ)
       ========================================================================== */
  const videoNoteModal = document.getElementById("videoNoteModal");
  const videoNotePreview = document.getElementById("videoNotePreview");
  let videoNoteStream = null,
    videoNoteRecorder = null,
    videoNoteChunks = [],
    isRecordingVideoNote = false;

  // Открытие модалки с камерой
  document
    .getElementById("videoNoteBtn")
    ?.addEventListener("click", async () => {
      try {
        videoNoteStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (videoNotePreview) videoNotePreview.srcObject = videoNoteStream;
        videoNoteModal?.classList.remove("hidden");
      } catch (err) {
        toast("Нет доступа к камере", "error");
      }
    });

  document
    .getElementById("startVideoCallBtn")
    ?.addEventListener("click", () => {
      if (!state.activeChatId || !state.activeChatId.startsWith("dm-")) {
        if (typeof toast === "function")
          toast("Звонки доступны только в личных сообщениях", "error");
        return;
      }

      const chat = state.chats.find((c) => c.id === state.activeChatId);
      const targetUser = chat ? chat.name : null;

      if (targetUser) {
        startCall(targetUser, true); // true = с видео
      }
    });

  // Сброс UI кнопки, когда запись остановлена
  videoNoteRecorder?.addEventListener("stop", () => {
    isRecordingVideoNote = false;
    const btn = document.getElementById("startVidRecordBtn");
    if (btn) {
      btn.textContent = "RECORD";
      btn.classList.replace("bg-red-600", "bg-pink-600");
    }
  });

  // Закрытие модалки и очистка потоков
  function closeVideoNoteModal() {
    if (videoNoteStream) {
      videoNoteStream.getTracks().forEach((t) => t.stop());
      videoNoteStream = null;
    }
    if (videoNotePreview) videoNotePreview.srcObject = null;
    videoNoteModal?.classList.add("hidden");
    const btn = document.getElementById("startVidRecordBtn");
    if (btn) {
      btn.textContent = "RECORD";
      btn.classList.replace("bg-red-600", "bg-pink-600");
    }
    isRecordingVideoNote = false;
  }

  document
    .getElementById("stopVidRecordBtn")
    ?.addEventListener("click", closeVideoNoteModal);

  /* ==========================================================================
       16. НАСТРОЙКИ (SETTINGS)
       ========================================================================== */

  // Открытие настроек
  document.getElementById("openSettingsBtn")?.addEventListener("click", () => {
    const s = loadSettings();
    const nameIn = document.getElementById("settingsDisplayName");
    if (nameIn) nameIn.value = state.currentUser;

    const keyIn = document.getElementById("settingsGeminiKey");
    if (keyIn) keyIn.value = s.geminiKey || "";

    const mr = document.getElementById("settingsMatrixRain");
    if (mr) mr.checked = s.matrixRain !== false;

    const rm = document.getElementById("settingsReducedMotion");
    if (rm) rm.checked = !!s.reducedMotion;

    const snd = document.getElementById("settingsSounds");
    if (snd) snd.checked = s.sounds !== false;

    const lang = document.getElementById("settingsLanguage");
    if (lang) lang.value = s.language || "ru";

    document.getElementById("settingsModal")?.classList.remove("hidden");
  });

  // Сохранение и закрытие настроек
  function closeSettings() {
    try {
      // 1. Загружаем текущие настройки (в них уже есть тема!)
      const s = loadSettings();

      // 2. Дополняем их данными из полей ввода
      const nameInput = document.getElementById("settingsDisplayName");
      if (nameInput) s.displayName = nameInput.value;

      const matrixRainInput = document.getElementById("settingsMatrixRain");
      if (matrixRainInput) s.matrixRain = matrixRainInput.checked;

      const reducedMotionInput = document.getElementById(
        "settingsReducedMotion",
      );
      if (reducedMotionInput) s.reducedMotion = reducedMotionInput.checked;

      const soundsInput = document.getElementById("settingsSounds");
      if (soundsInput) s.sounds = soundsInput.checked;

      const langInput = document.getElementById("settingsLanguage");
      if (langInput) s.language = langInput.value;

      // 3. Применяем настройки
      if (window.matrixActive !== undefined) window.matrixActive = s.matrixRain;
      document.body.classList.toggle("reduced-motion", s.reducedMotion);

      if (typeof applyLanguage === "function") applyLanguage(s.language);

      // 4. Сохраняем (теперь тема гарантированно на месте)
      saveSettings(s);
      saveState();

      if (typeof toast === "function") toast(t("saved"), "success");

      // 5. Закрываем окно
      document.getElementById("settingsModal")?.classList.add("hidden");
    } catch (err) {
      console.error("Ошибка при сохранении настроек:", err);
    }
  }

  document
    .getElementById("closeSettingsBtn")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      closeSettings();
    });
  document.getElementById("settingsModal")?.addEventListener("click", (e) => {
    if (e.target.id === "settingsModal") closeSettings();
  });

  // Смена языка
  document
    .getElementById("settingsLanguage")
    ?.addEventListener("change", (e) => {
      const lang = e.target.value || "ru";
      applyLanguage(lang);
      const s = loadSettings();
      s.language = lang;
      saveSettings(s);
    });

  // Смена темы (ФИКС БАГА С ПЕРЕЗАПИСЬЮ КЛАССОВ)
  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      // Убираем старые темы
      document.body.classList.remove(
        "theme-cyan",
        "theme-emerald",
        "theme-pink",
        "theme-amber",
      );
      // Добавляем новую
      document.body.classList.add("theme-" + theme);
      // Сохраняем в настройки
      const s = loadSettings();
      s.theme = theme;
      saveSettings(s);
    });
  });

  /* ==========================================================================
       17. КРИПТОГРАФИЯ И ДАННЫЕ
       ========================================================================== */
  document
    .getElementById("regenKeysBtn")
    ?.addEventListener("click", async () => {
      await CryptoEngine.generateKeyPair();
      toast("Ключи сгенерированы", "success");
    });

  document
    .getElementById("copyPublicKeyBtn")
    ?.addEventListener("click", async () => {
      const key = await CryptoEngine.exportPublicKey();
      await navigator.clipboard.writeText(key);
      toast("Public key скопирован", "success");
    });

  document.getElementById("exportChatsBtn")?.addEventListener("click", () => {
    const data = JSON.stringify(
      { chats: state.chats, messages: state.messages },
      null,
      2,
    );
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cyberpulse-export-${Date.now()}.json`;
    a.click();
  });
  // --- КНОПКА ВЫХОДА ИЗ СИСТЕМЫ ---
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    // 1. Закрываем WebSocket
    if (typeof window.mySocket !== "undefined" && window.mySocket) {
      window.mySocket.close();
    }
    // 2. Очищаем токен и логин
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    // 3. Перезагружаем страницу
    location.reload();
  });

  document.getElementById("clearAllDataBtn")?.addEventListener("click", () => {
    if (!confirm("Удалить все данные?")) return;
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_SETTINGS);
    indexedDB.deleteDatabase(IDB_NAME);
    location.reload();
  });

  // Кнопка "Сводка чата"
  document
    .getElementById("summarizeChatBtn")
    ?.addEventListener("click", async () => {
      const msgs = (state.messages[state.activeChatId] || []).slice(-50); // Берем последние 50
      const text = msgs
        .map((m) => `${m.sender}: ${m.text || "[media]"}`)
        .join("\n");
      const prompt = `Сделай краткое структурированное резюме этого чата (bullet points):\n\n${text}`;
      const aiFeed = document.getElementById("aiFeed");

      if (aiFeed)
        aiFeed.innerHTML += `<div class="p-2 rounded bg-slate-900 border border-cyan-500/40 text-slate-200"><strong class="text-cyan-400">SUMMARIZING...</strong></div>`;

      const answer = await callGemini(
        prompt,
        "Ты аналитик чатов. Выдай краткое резюме в виде списка.",
      );
      if (answer && aiFeed) {
        aiFeed.innerHTML += `<div class="p-2 rounded bg-slate-900 border border-cyan-500/40 text-slate-200"><strong class="text-cyan-400">SUMMARY:</strong><br>${escapeHtml(answer).replace(/\n/g, "<br>")}</div>`;
        aiFeed.scrollTop = aiFeed.scrollHeight;
      }
    });

  /* ==========================================================================
       20. ГОЛОСОВАЯ СЦЕНА (VOICE STAGE)
       ========================================================================== */
  let onStage = false,
    stageStream = null;

  // Отрисовка участников сцены
  function renderStageSpeakers() {
    const grid = document.getElementById("stageSpeakers");
    if (!grid) return;

    grid.innerHTML = `
        <div class="p-3 bg-slate-900/80 rounded-xl border ${onStage ? "border-emerald-500/40" : "border-slate-800"} flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-bold mb-1 ${onStage ? "animate-pulse" : ""}">
            ${state.currentUser.slice(0, 2).toUpperCase()}
          </div>
          <span class="text-xs font-bold text-slate-200">${escapeHtml(state.currentUser)}</span>
          <span class="text-[9px] text-emerald-400 font-mono">${onStage ? "SPEAKING" : "OFFLINE"}</span>
        </div>
        <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col items-center opacity-60">
          <div class="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold mb-1">X</div>
          <span class="text-xs text-slate-400">Listener</span>
          <span class="text-[9px] text-slate-500 font-mono">MUTED</span>
        </div>`;
  }

  document
    .getElementById("openVoiceStageBtn")
    ?.addEventListener("click", () => {
      document.getElementById("voiceStageModal")?.classList.remove("hidden");
      renderStageSpeakers();
    });

  document
    .getElementById("closeVoiceStageBtn")
    ?.addEventListener("click", () =>
      document.getElementById("voiceStageModal")?.classList.add("hidden"),
    );

  // Вход на сцену (включает микрофон)
  document
    .getElementById("joinStageBtn")
    ?.addEventListener("click", async () => {
      try {
        stageStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        onStage = true;
        document.getElementById("joinStageBtn")?.classList.add("hidden");
        document.getElementById("leaveStageBtn")?.classList.remove("hidden");
        renderStageSpeakers();
        toast("Вы на сцене (локально)", "success");
      } catch {
        toast("Нет доступа к микрофону", "error");
      }
    });

  // Выход со сцены
  document.getElementById("leaveStageBtn")?.addEventListener("click", () => {
    if (stageStream) stageStream.getTracks().forEach((t) => t.stop());
    stageStream = null;
    onStage = false;
    document.getElementById("joinStageBtn")?.classList.remove("hidden");
    document.getElementById("leaveStageBtn")?.classList.add("hidden");
    renderStageSpeakers();
  });

  document
    .getElementById("raiseHandBtn")
    ?.addEventListener("click", () => toast("✋ Рука поднята (демо)", "info"));

  /* ==========================================================================
       21. АРКАДА (PAC-MAN)
       ========================================================================== */
  document
    .getElementById("openArcadeBtn")
    ?.addEventListener("click", () =>
      document.getElementById("arcadeModal")?.classList.remove("hidden"),
    );
  document
    .getElementById("closeArcadeBtn")
    ?.addEventListener("click", () =>
      document.getElementById("arcadeModal")?.classList.add("hidden"),
    );
  /* ==========================================================================
       22. МЕДИА-ПРОСМОТРЩИК (ПОЛНОЭКРАННЫЙ)
       ========================================================================== */
  // Эта функция вызывается из renderMessages при клике на картинку/видео
  async function openMediaViewer(mediaId, kind) {
    const viewer = document.getElementById("mediaViewer");
    const img = document.getElementById("mediaViewerImg");
    const vid = document.getElementById("mediaViewerVideo");
    if (!viewer) return;

    img?.classList.add("hidden");
    vid?.classList.add("hidden");

    try {
      const blob = await idbGet(mediaId);
      if (!blob) return;
      const url = URL.createObjectURL(blob);

      if (kind === "image") {
        if (img) {
          img.src = url;
          img.classList.remove("hidden");
        }
      } else {
        if (vid) {
          vid.src = url;
          vid.classList.remove("hidden");
        }
      }
      viewer.classList.remove("hidden");
      viewer.classList.add("flex");
    } catch (e) {
      toast("Не удалось загрузить медиа", "error");
    }
  }

  // Закрытие полноэкранного просмотра
  document.getElementById("closeMediaViewer")?.addEventListener("click", () => {
    const viewer = document.getElementById("mediaViewer");
    viewer?.classList.add("hidden");
    viewer?.classList.remove("flex");
    const vid = document.getElementById("mediaViewerVideo");
    if (vid) {
      vid.pause();
      vid.src = "";
    }
  });

  /* ==========================================================================
       23. ФИЛЬТР СПИСКА ЧАТОВ И ТАБЫ
       ========================================================================== */
  // Глобальный поиск по чатам (в сайдбаре)
  document.getElementById("chatSearchInput")?.addEventListener("input", (e) => {
    renderChatList(e.target.value);
  });

  /* ==========================================================================
       23. УПРАВЛЕНИЕ ЧАТАМИ (ВКЛАДКИ И СОЗДАНИЕ DM)
       ========================================================================== */

  // 1. Визуальное переключение табов Каналы/DM
  const switchTab = (tabName) => {
    window.currentChatTab = tabName; // Сохраняем состояние

    const globalBtn = document.getElementById("tabGlobal");
    const dmBtn = document.getElementById("tabDM");

    if (tabName === "channel") {
      globalBtn?.classList.add("border-cyan-400", "text-cyan-400");
      dmBtn?.classList.remove("border-cyan-400", "text-cyan-400");
    } else {
      dmBtn?.classList.add("border-cyan-400", "text-cyan-400");
      globalBtn?.classList.remove("border-cyan-400", "text-cyan-400");
    }

    // Перерисовываем список с учетом поиска
    if (window.renderChatList) {
      window.renderChatList(
        document.getElementById("chatSearchInput")?.value || "",
      );
    }
  };

  document
    .getElementById("tabGlobal")
    ?.addEventListener("click", () => switchTab("channel"));
  document
    .getElementById("tabDM")
    ?.addEventListener("click", () => switchTab("dm"));

  // 2. Создание нового личного чата (DM)
  document.getElementById("addDmBtn")?.addEventListener("click", async () => {
    const targetUser = prompt(
      "Введите логин пользователя, с которым хотите начать чат:",
    );

    // Защита от пустого ввода и от создания чата с самим собой
    if (!targetUser || targetUser === state.currentUser) {
      if (typeof toast === "function") toast("Некорректный логин", "error");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/search_user/${targetUser}`,
      );

      if (!response.ok) {
        if (typeof toast === "function")
          toast("Пользователь не найден", "error");
        return;
      }

      // Формируем уникальный ID для чата (сортируем имена по алфавиту)
      const sortedNames = [state.currentUser, targetUser].sort();
      const chatId = `dm-${sortedNames[0]}_${sortedNames[1]}`;

      // Проверяем, нет ли уже такого чата
      if (!state.chats.find((c) => c.id === chatId)) {
        state.chats.push({
          id: chatId,
          name: targetUser,
          type: "dm",
          unread: 0,
        });

        if (window.saveState) window.saveState();

        // ❗ ВАЖНО: Принудительно переключаем на вкладку "Личные" и перерисовываем
        switchTab("dm");

        if (typeof toast === "function") toast("Чат создан!", "success");
      } else {
        if (typeof toast === "function")
          toast("Этот чат уже существует", "error");
        switchTab("dm"); // На всякий случай показываем личные
      }
    } catch (error) {
      console.error("Ошибка поиска:", error);
      if (typeof toast === "function") toast("Ошибка сервера", "error");
    }
  });

  /* ==========================================================================
       24. МОБИЛЬНАЯ НАВИГАЦИЯ
       ========================================================================== */
  // Нижнее меню (Чаты / Звонки / Настройки)
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Сброс активных классов у всех кнопок
      document.querySelectorAll(".nav-btn").forEach((b) => {
        b.classList.remove("text-[#00f0ff]");
        b.classList.add("text-[#708499]");
      });
      // Установка активной
      btn.classList.add("text-[#00f0ff]");
      btn.classList.remove("text-[#708499]");

      const target = btn.dataset.target;

      if (target === "viewChats") {
        document.getElementById("appSidebar")?.classList.remove("hidden");
        document.getElementById("mainChatContainer")?.classList.add("hidden");
        document.getElementById("mainChatContainer")?.classList.remove("flex");
      } else if (target === "viewCalls") {
        ////
        btn.classList.remove("text-[#00f0ff]");
        btn.classList.add("text-[#708499]");
      } else if (target === "viewSettings") {
        document.getElementById("openSettingsBtn")?.click();
        btn.classList.remove("text-[#00f0ff]");
        btn.classList.add("text-[#708499]");
      }
    });
  });

  // Кнопка "Назад" в мобильном чате
  document.getElementById("mobileBackBtn")?.addEventListener("click", () => {
    document.getElementById("mainChatContainer")?.classList.add("hidden");
    document.getElementById("mainChatContainer")?.classList.remove("flex");
    document.getElementById("appSidebar")?.classList.remove("hidden");
  });

  /* ==========================================================================
       25. ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ (Escape, Scroll)
       ========================================================================== */
  // Закрытие контекстного меню по Escape
  document.addEventListener("keydown", (e) => {
    // Звук клика для всех кнопок
    document.addEventListener("click", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest(".theme-btn") ||
        e.target.closest(".nav-btn") ||
        e.target.closest("label[for]")
      ) {
        SoundEngine.playClick();
      }
    });
    if (e.key === "Escape") {
      // Звук клика для всех кнопок
      document.addEventListener("click", (e) => {
        const isButton =
          e.target.closest("button") ||
          e.target.closest(".theme-btn") ||
          e.target.closest(".nav-btn") ||
          e.target.closest("label[for]");
        if (isButton) {
          SoundEngine.playClick();
        }
      });
      contextMenu?.classList.add("hidden");
      quickReactPanel?.classList.add("hidden");
      document.getElementById("emojiModal")?.classList.add("hidden");
    }
  });

  // Скрытие контекстного меню при скролле
  messageFeedEl?.addEventListener("scroll", () => {
    contextMenu?.classList.add("hidden");
  });

  // Эмодзи-пикер
  // Логика для красивого пикера эмодзи
  setTimeout(() => {
    const emojiBtn = document.getElementById("emojiPickerBtn");
    const emojiPicker = document.querySelector("emoji-picker");
    const msgInput = document.getElementById("messageInput");

    if (emojiBtn && emojiPicker && msgInput) {
      // Открываем/закрываем окно
      emojiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        emojiPicker.classList.toggle("hidden");
        console.log("Кнопка смайлика нажата!"); // Проверка для консоли
      });

      // Вставляем смайл
      emojiPicker.addEventListener("emoji-click", (event) => {
        msgInput.value += event.detail.unicode;
        msgInput.focus();
      });

      // Закрываем при клике мимо
      document.addEventListener("click", (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
          emojiPicker.classList.add("hidden");
        }
      });
    } else {
      console.error("Не найдены элементы для смайликов!", {
        emojiBtn,
        emojiPicker,
        msgInput,
      });
    }
  }, 500); // Ждем полсекунды

  // Переключение Матрицы
  document.getElementById("toggleMatrixBtn")?.addEventListener("click", () => {
    window.matrixActive = !window.matrixActive;
    const s = loadSettings();
    s.matrixRain = window.matrixActive;
    saveSettings(s);
    toast(window.matrixActive ? "Matrix rain ON" : "Matrix rain OFF");
  });

  /* ==========================================================================
       26. ИНИЦИАЛИЗАЦИЯ (WINDOW.ONLOAD)
       ========================================================================== */

  // 3. ВОЗВРАЩАЕМ СЧЕТЧИК НЕПРОЧИТАННЫХ В ЗАГОЛОВКЕ
  function updateTitle() {
    const total = state.chats.reduce((s, c) => s + (c.unread || 0), 0);
    document.title =
      total > 0 ? `(${total}) CYBER_PULSE MATRIX` : "CYBER_PULSE MATRIX";
  }

  // 5. ОБНОВЛЯЕМ ЗАГОЛОВОК ПРИ ОТПРАВКЕ/ПРОЧТЕНИИ
  // Патчим функцию renderChatList, чтобы она вызывала updateTitle
  const originalRenderChatList = renderChatList;
  renderChatList = function (filter = "") {
    originalRenderChatList(filter);
    updateTitle();
  };
  // Включение/выключение режима секретного сообщения
  document.getElementById("secretMsgBtn")?.addEventListener("click", () => {
    state.secretMode = !state.secretMode;
    const btn = document.getElementById("secretMsgBtn");
    if (state.secretMode) {
      btn.classList.remove("text-slate-400");
      btn.classList.add("text-red-500", "animate-pulse");
      toast("Режим самоуничтожения ВКЛ (10 сек)", "error");
    } else {
      btn.classList.remove("text-red-500", "animate-pulse");
      btn.classList.add("text-slate-400");
    }
  });
  /* ==========================================================================
       ГОЛОСОВОЙ ВВОД ТЕКСТА (DICTAPHONE)
       ========================================================================== */
  const dictaphoneBtn = document.getElementById("dictaphoneBtn");
  let recognition = null;
  let isListening = false;

  // Проверяем, поддерживает ли браузер распознавание речи
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "ru-RU"; // Язык распознавания
    recognition.continuous = false;
    recognition.interimResults = false;

    // Когда начинаем слушать
    recognition.onstart = () => {
      isListening = true;
      if (dictaphoneBtn) {
        dictaphoneBtn.classList.add("text-red-500", "animate-pulse");
      }
      if (messageInput) {
        messageInput.placeholder = "Слушаю... Говорите.";
      }
    };

    // Когда получили результат
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (messageInput) {
        messageInput.value += (messageInput.value ? " " : "") + transcript;
      }
    };

    // Обработка ошибок
    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        toast("Ошибка распознавания: " + event.error, "error");
      }
    };

    // Когда микрофон отключается
    recognition.onend = () => {
      isListening = false;
      if (dictaphoneBtn) {
        dictaphoneBtn.classList.remove("text-red-500", "animate-pulse");
      }
      if (messageInput) {
        messageInput.placeholder = t("placeholder") || "Передать сообщение...";
      }
    };

    // Клик по кнопке
    if (dictaphoneBtn) {
      dictaphoneBtn.addEventListener("click", () => {
        if (isListening) {
          recognition.stop();
        } else {
          try {
            recognition.start();
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
  } else {
    if (dictaphoneBtn) {
      dictaphoneBtn.addEventListener("click", () => {
        toast("Ваш браузер не поддерживает голосовой ввод", "error");
      });
    }
  }
  /* ==========================================================================
       КАСТОМНЫЕ ОБОИ ЧАТА
       ========================================================================== */
  const bgUploadInput = document.getElementById("bgUploadInput");
  const resetBgBtn = document.getElementById("resetBgBtn");

  // Функция применения обоев
  async function applyChatBackground() {
    const feed = document.getElementById("messageFeed");
    if (!feed) return;

    try {
      // Ищем картинку в нашей базе IndexedDB
      const bgBlob = await idbGet("custom_bg");

      if (bgBlob) {
        const url = URL.createObjectURL(bgBlob);
        // Добавляем темный градиент (85% прозрачности), чтобы текст легко читался
        feed.style.backgroundImage = `linear-gradient(rgba(14, 22, 33, 0.85), rgba(14, 22, 33, 0.85)), url(${url})`;
        feed.style.backgroundSize = "cover";
        feed.style.backgroundPosition = "center";
        feed.style.backgroundAttachment = "local"; // Чтобы фон скроллился вместе с сообщениями
      } else {
        // Если картинки нет — убираем фон (остается стандартный черный)
        feed.style.backgroundImage = "none";
      }
    } catch (e) {
      console.error("Ошибка загрузки обоев", e);
    }
  }

  // Обработка загрузки нового фото
  if (bgUploadInput) {
    bgUploadInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Ограничение размера (макс 5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        toast("Картинка слишком большая (макс. 5 МБ)", "error");
        return;
      }

      // Сохраняем в базу и применяем
      await idbPut("custom_bg", file);
      await applyChatBackground();
      toast("Обои установлены!", "success");
      e.target.value = ""; // Очищаем поле, чтобы можно было загрузить ту же картинку снова
    });
  }

  // Обработка сброса обоев
  if (resetBgBtn) {
    resetBgBtn.addEventListener("click", async () => {
      await idbDelete("custom_bg");
      await applyChatBackground();
      toast("Обои сброшены", "success");
    });
  }

  // 1. Открываем IndexedDB
  await openIDB();

  // 2. Применяем настройки (называем переменную settings, чтобы не было конфликтов)
  const settings = loadSettings();
  applyLanguage(settings.language || "ru");
  // Запускаем фоновую матрицу
  if (typeof initMatrix === "function") {
    initMatrix();
  }
  // 3. Восстанавливаем тему
  if (settings.theme) {
    document.body.classList.remove(
      "theme-cyan",
      "theme-emerald",
      "theme-pink",
      "theme-amber",
    );
    document.body.classList.add("theme-" + settings.theme);
  }
  // Очищаем поиск при загрузке (с задержкой, чтобы перебить автозаполнение браузера)
  setTimeout(() => {
    const searchInp = document.getElementById("chatSearchInput");
    if (searchInp && searchInp.value === "NEO1") {
      searchInp.value = "";
      if (window.renderChatList) window.renderChatList("");
    }
  }, 100);
  // Запускаем очистку старых медиа в фоне (через 3 секунды после загрузки)
  setTimeout(() => {
    if (window.cleanupOldMedia) {
      window.cleanupOldMedia();
    }
  }, 3000);

  // ...
  // 4. Рендерим всё
  renderChatList();
  renderMessages(true);

  renderStories();
  // Очищаем поиск при загрузке, чтобы не скрывать чаты

  // 5. Устанавливаем профиль
  const uc = document.getElementById("userCallsign");
  if (uc) uc.textContent = state.currentUser;
  const ua = document.getElementById("userAvatar");
  if (ua) ua.textContent = state.currentUser.slice(0, 2).toUpperCase();

  // 6. Восстанавливаем закрепленное сообщение
  if (state.pinned) {
    const pbc = document.getElementById("pinnedBannerContent");
    if (pbc) pbc.textContent = state.pinned.text;
    document.getElementById("pinnedBanner")?.classList.remove("hidden");
  }

  // --- ЛОГИКА ДЛЯ МОБИЛЬНОЙ ПАНЕЛИ ИИ (GEMINI) ---

  const aiDrawer = document.getElementById("aiDrawer");
  const openAiBtn = document.getElementById("openAiDrawerBtn");
  const closeAiBtn = document.getElementById("closeAiDrawerBtn");

  // Если кнопки и панель существуют на странице
  if (aiDrawer && openAiBtn && closeAiBtn) {
    // Открытие: убираем класс hidden
    openAiBtn.addEventListener("click", () => {
      aiDrawer.classList.remove("hidden");
      // Если на телефоне панель должна занимать весь экран, можно добавить:
      aiDrawer.classList.add("flex", "absolute", "inset-0", "z-50", "w-full");
    });

    // Закрытие: возвращаем класс hidden
    closeAiBtn.addEventListener("click", () => {
      aiDrawer.classList.add("hidden");
      aiDrawer.classList.remove(
        "flex",
        "absolute",
        "inset-0",
        "z-50",
        "w-full",
      );
    });
  }
});
// --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК ЧАТОВ ---
window.currentChatTab = "channel"; // По умолчанию показываем каналы

const tabGlobalBtn = document.getElementById("tabGlobal");
const tabDMBtn = document.getElementById("tabDM");

function updateTabStyles(activeBtn, inactiveBtn) {
  activeBtn.classList.add("border-cyan-400", "text-cyan-400");
  activeBtn.classList.remove("border-transparent", "hover:text-slate-200");

  inactiveBtn.classList.remove("border-cyan-400", "text-cyan-400");
  inactiveBtn.classList.add("border-transparent", "hover:text-slate-200");
}

// --- ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (КАНАЛЫ / ЛИЧНЫЕ) ---
const switchTab = (tabName) => {
  window.currentChatTab = tabName;

  const globalBtn = document.getElementById("tabGlobal");
  const dmBtn = document.getElementById("tabDM");

  if (tabName === "channel") {
    globalBtn?.classList.add("border-cyan-400", "text-cyan-400");
    dmBtn?.classList.remove("border-cyan-400", "text-cyan-400");
  } else {
    dmBtn?.classList.add("border-cyan-400", "text-cyan-400");
    globalBtn?.classList.remove("border-cyan-400", "text-cyan-400");
  }

  if (window.renderChatList) {
    window.renderChatList(
      document.getElementById("chatSearchInput")?.value || "",
    );
  }
};

// Привязываем клики к кнопкам
document
  .getElementById("tabGlobal")
  ?.addEventListener("click", () => switchTab("channel"));
document
  .getElementById("tabDM")
  ?.addEventListener("click", () => switchTab("dm"));
tabGlobalBtn.addEventListener("click", () => {
  window.currentChatTab = "channel";
  updateTabStyles(tabGlobalBtn, tabDMBtn);
  if (typeof renderChatList === "function") renderChatList(); // Перерисовываем список
});

tabDMBtn.addEventListener("click", () => {
  window.currentChatTab = "dm";
  updateTabStyles(tabDMBtn, tabGlobalBtn);
  if (typeof renderChatList === "function") renderChatList(); // Перерисовываем список
});
