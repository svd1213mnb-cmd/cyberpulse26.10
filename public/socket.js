// ==========================================
// socket.js - РАБОТА С WEBSOCKET
// ==========================================

window.mySocket = null;

// 1. Подключение к серверу
window.connectWebSocket = function (token) {
  if (
    window.mySocket &&
    (window.mySocket.readyState === WebSocket.OPEN ||
      window.mySocket.readyState === WebSocket.CONNECTING)
  ) {
    console.log("Сокет уже активен, пропускаем.");
    return;
  }

  window.mySocket = new WebSocket(`ws://127.0.0.1:8000/ws?token=${token}`);

  window.mySocket.onopen = () => {
    console.log("Успешно подключено к Python-серверу!");
    const chatId =
      window.state && window.state.activeChatId
        ? window.state.activeChatId
        : "global";
    window.mySocket.send(
      JSON.stringify({ action: "get_history", chatId: chatId }),
    );
  };

  window.mySocket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (window.handleIncomingMessage) window.handleIncomingMessage(msg);
  };

  window.mySocket.onclose = () => {
    console.log("WebSocket отключен");
  };
};

// 2. Обработка входящих сообщений
window.handleIncomingMessage = function (msg) {
  console.log("пришло с сервера:", msg);

  // --- ИНДИКАТОР НАБОРА ТЕКСТА ---
  if (msg.type === "typing" && msg.sender !== window.state.currentUser) {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.innerHTML = `
        <span class="text-slate-300">${msg.sender}</span> печатает
        <span class="typing-dots">
          <span></span><span></span><span></span>
        </span>
      `;
      indicator.classList.remove("hidden");
      clearTimeout(window.hideTypingTimer);
      window.hideTypingTimer = setTimeout(
        () => indicator.classList.add("hidden"),
        2000,
      );
    }
  }

  // --- ИСТОРИЯ СООБЩЕНИЙ ---
  if (msg.type === "history") {
    // 1. Сбрасываем флаг, что мы что-то грузим
    window.isFetchingHistory = false;

    // 2. Если сервер прислал пустоту — значит, история закончилась
    if (!msg.data || msg.data.length === 0) {
      window.isLoadingOlderMessages = false;
      return;
    }

    const chatId = msg.data[0].chatId || window.state.activeChatId;

    // 3. Твоя логика создания DM (оставляем без изменений)
    if (
      chatId.startsWith("dm-") &&
      !window.state.chats.find((c) => c.id === chatId)
    ) {
      const parts = chatId.replace("dm-", "").split("_");
      const otherUser =
        parts.find((p) => p !== window.state.currentUser) || "Unknown";
      window.state.chats.push({
        id: chatId,
        name: otherUser,
        type: "dm",
        unread: 0,
      });
    }

    // 4. Твой маппинг isSelf (оставляем без изменений)
    const newMessages = msg.data.map((m) => {
      m.isSelf = m.sender === window.state.currentUser;
      return m;
    });

    if (!window.state.messages[chatId]) {
      window.state.messages[chatId] = [];
    }

    // 5. НОВАЯ ЛОГИКА: Склеиваем или заменяем
    if (window.isLoadingOlderMessages) {
      // Подгрузка вверх: склеиваем старые + текущие
      const currentMsgs = window.state.messages[chatId];
      // Фильтруем дубликаты, чтобы сообщения не двоились
      const uniqueNewMsgs = newMessages.filter(
        (newM) => !currentMsgs.some((oldM) => oldM.id === newM.id),
      );
      window.state.messages[chatId] = [...uniqueNewMsgs, ...currentMsgs];
    } else {
      // Первичная загрузка чата: просто заменяем
      window.state.messages[chatId] = newMessages;
    }

    // 6. Отрисовка
    if (window.state.activeChatId === chatId && window.renderMessages) {
      // ВАЖНО: Если грузим историю вверх, передаем false, чтобы чат не скроллился в самый низ!
      window.renderMessages(window.isLoadingOlderMessages ? false : true);
    }

    if (window.renderChatList) window.renderChatList();
    if (window.saveState) window.saveState();

    // Сбрасываем флаг после успешной отрисовки
    window.isLoadingOlderMessages = false;

    return;
  }

  // --- НОВОЕ СООБЩЕНИЕ ---
  if (msg.type === "new_message") {
    const newMsg = msg.data;
    const chatId = newMsg.chatId || window.state.activeChatId;

    if (
      chatId.startsWith("dm-") &&
      !window.state.chats.find((c) => c.id === chatId)
    ) {
      const parts = chatId.replace("dm-", "").split("_");
      const otherUser =
        parts.find((p) => p !== window.state.currentUser) || "Unknown";
      window.state.chats.push({
        id: chatId,
        name: otherUser,
        type: "dm",
        unread: 0,
      });
    }

    if (chatId.startsWith("dm-")) {
      window.currentChatTab = "dm";
      document
        .getElementById("tabDM")
        ?.classList.add("border-cyan-400", "text-cyan-400");
      document
        .getElementById("tabGlobal")
        ?.classList.remove("border-cyan-400", "text-cyan-400");
      const searchInput = document.getElementById("chatSearchInput");
      if (searchInput) searchInput.value = "";
    }

    if (!window.state.messages[chatId]) window.state.messages[chatId] = [];

    if (!window.state.messages[chatId].find((m) => m.id === newMsg.id)) {
      newMsg.isSelf = newMsg.sender === window.state.currentUser;
      window.state.messages[chatId].push(newMsg);

      const chat = window.state.chats.find((c) => c.id === chatId);
      if (chat && !newMsg.isSelf) chat.unread = (chat.unread || 0) + 1;

      if (window.state.activeChatId === chatId && window.renderMessages) {
        window.renderMessages(true);
      }
      if (window.renderChatList) window.renderChatList("");
      if (window.saveState) window.saveState();
    }
  }

  // --- ЗВОНКИ (WebRTC) ---
  if (msg.action === "call_offer") {
    if (typeof window.receiveCall === "function")
      window.receiveCall(msg.from, msg.data);
    if (window.showSystemNotification)
      window.showSystemNotification(
        `📞 Звонок от ${msg.from}`,
        "Нажмите, чтобы ответить",
        true,
      );
  }

  if (
    msg.action === "call_answer" &&
    typeof window.handleAnswer === "function"
  ) {
    window.handleAnswer(msg.data);
  }

  if (
    msg.action === "ice_candidate" &&
    typeof window.handleIceCandidate === "function"
  ) {
    window.handleIceCandidate(msg.data);
  }

  if (
    msg.action === "call_declined" &&
    typeof window.declineCall === "function"
  ) {
    if (window.toast) window.toast("Собеседник отклонил звонок", "error");
    window.endCall(false);
  }

  if (msg.action === "call_ended" && typeof window.endCall === "function") {
    if (window.toast) window.toast("Собеседник завершил звонок", "info");
    window.endCall(false);
  }
};
