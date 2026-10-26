// Глобальный трекер текущего играющего аудио
let currentlyPlayingAudio = null;
// --- Отрисовка списка чатов ---
function renderChatList(filter = "") {
  const chatListEl = document.getElementById("chatList");
  if (!chatListEl) return;
  chatListEl.innerHTML = "";
  const q = filter.trim().toLowerCase();

  state.chats
    .filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q)) &&
        c.type === window.currentChatTab,
    )
    .forEach((chat) => {
      const item = document.createElement("div");
      item.className = `p-3 flex items-center justify-between cursor-pointer transition border-b border-slate-800/40 ${state.activeChatId === chat.id ? "bg-cyan-950/40 border-l-2 border-cyan-400" : "hover:bg-slate-900/60"}`;

      item.onclick = () => {
        switchChat(chat.id);
        if (window.innerWidth < 768) {
          document.getElementById("appSidebar")?.classList.add("hidden");
          document
            .getElementById("mainChatContainer")
            ?.classList.remove("hidden");
          document.getElementById("mainChatContainer")?.classList.add("flex");
        }
      };

      item.innerHTML = `
      <div class="flex items-center space-x-3 overflow-hidden">
        <div class="w-8 h-8 md:w-7 md:h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold ${chat.type === "channel" ? "text-cyan-400" : "text-emerald-400"}">${chat.type === "channel" ? "#" : "DM"}</div>
        <span class="text-sm md:text-xs font-medium text-slate-200 truncate code-font">${escapeHtml(chat.name)}</span>
      </div>
      ${chat.unread > 0 ? `<span class="px-1.5 py-0.5 rounded-full bg-cyan-500 text-black font-bold text-[10px]">${chat.unread}</span>` : ""}
    `;
      chatListEl.appendChild(item);
    });
}

// --- Отрисовка ленты сообщений ---
function renderMessages(forceScroll = false) {
  const messageFeedEl = document.getElementById("messageFeed");
  if (!messageFeedEl) return;

  // 1. ЗАПОМИНАЕМ ВЫСОТУ И ПОЗИЦИЮ ДО ОЧИСТКИ
  const prevScrollHeight = messageFeedEl.scrollHeight;
  const prevScrollTop = messageFeedEl.scrollTop;

  const isAtBottom =
    messageFeedEl.scrollHeight -
      messageFeedEl.scrollTop -
      messageFeedEl.clientHeight <
    150;

  if (state.messages[state.activeChatId]) {
    state.messages[state.activeChatId] = state.messages[
      state.activeChatId
    ].filter((msg) => {
      if (msg.secret && msg.expiresAt && Date.now() > msg.expiresAt)
        return false;
      return true;
    });
  }

  messageFeedEl.innerHTML = "";
  const currentMsgs = state.messages[state.activeChatId] || [];

  currentMsgs.forEach((msg) => {
    const wrap = document.createElement("div");
    const isNewMessage = Date.now() - msg.timestamp < 2000;
    const animationClass = isNewMessage ? "msg-animate" : "";

    wrap.className = `flex flex-col ${msg.isSelf ? "items-end" : "items-start"} space-y-1 group relative w-full mb-3 ${animationClass}`;
    wrap.dataset.msgId = msg.id;

    // ❗ ПОДСВЕТКА НАЙДЕННОГО СООБЩЕНИЯ
    if (msg.id === window.highlightMessageId) {
      wrap.classList.add("ring-2", "ring-cyan-500", "bg-cyan-900/20");
      setTimeout(() => {
        wrap.classList.remove("ring-2", "ring-cyan-500", "bg-cyan-900/20");
        window.highlightMessageId = null;
      }, 2000);
    }

    // Копирование по клику
    wrap.style.cursor = "pointer";
    wrap.title = "Нажми, чтобы скопировать";
    wrap.addEventListener("click", () => {
      const textToCopy = msg.text || wrap.innerText;
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (typeof toast === "function") toast("Текст скопирован!", "success");
      });
    });

    // Имя отправителя и время
    const meta = document.createElement("span");
    meta.className = "text-[10px] text-slate-500 code-font px-1";
    meta.textContent = `${msg.sender} • ${formatTime(msg.timestamp)}`;

    // Сам пузырь сообщения
    const bubble = document.createElement("div");
    const secretClass = msg.secret
      ? "border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
      : "";
    bubble.className = `max-w-[85%] md:max-w-md px-3.5 py-2 rounded-xl text-sm relative ${msg.isSelf ? "msg-bubble-self text-white" : "msg-bubble-other text-slate-200"} ${secretClass}`;

    // Логика секретных сообщений
    if (msg.secret && msg.expiresAt) {
      const timeLeft = msg.expiresAt - Date.now();
      if (timeLeft > 0) {
        setTimeout(() => {
          if (window.renderMessages) window.renderMessages();
        }, timeLeft + 100);
      }
    }

    // Цитата (ответ на сообщение)
    if (msg.replyTo) {
      const quote = document.createElement("div");
      quote.className =
        "mb-2 pl-2.5 pr-2 py-1.5 rounded-md bg-black/30 border-l-2 border-cyan-400 text-[11px] cursor-pointer hover:bg-black/50 transition";
      quote.innerHTML = `<div class="font-bold text-cyan-300 flex items-center gap-1"><i class="fas fa-reply text-[9px]"></i> ${escapeHtml(msg.replyTo.sender)}</div><div class="truncate text-slate-300 opacity-90">${escapeHtml(msg.replyTo.text?.slice(0, 90) || "[media]")}</div>`;
      bubble.appendChild(quote);
    }

    // Обычный текст
    if (msg.text && !msg.poll && !msg.media) {
      const textDiv = document.createElement("div");
      textDiv.className = "msg-text";
      textDiv.innerHTML = formatMessageText(msg.text);
      bubble.appendChild(textDiv);
    }

    // Опросы
    if (msg.poll) {
      const pollDiv = document.createElement("div");
      pollDiv.className = "space-y-2 w-full min-w-[200px]";
      const total = (msg.poll.v1 || 0) + (msg.poll.v2 || 0) || 1;
      const p1 = Math.round(((msg.poll.v1 || 0) / total) * 100);
      const p2 = Math.round(((msg.poll.v2 || 0) / total) * 100);
      const voted = msg.poll.voters && msg.poll.voters[state.currentUser];

      pollDiv.innerHTML = `
              <span class="font-bold text-cyan-300 block border-b border-cyan-500/30 pb-1">${escapeHtml(msg.poll.question)}</span>
              <button data-poll-opt="1" class="w-full text-left p-1.5 rounded bg-black/40 hover:bg-cyan-500/20 text-xs relative overflow-hidden ${voted ? "opacity-70 pointer-events-none" : ""}">
                <div class="absolute inset-0 bg-cyan-500/20" style="width:${p1}%"></div><span class="relative">${escapeHtml(msg.poll.opt1)} — ${msg.poll.v1 || 0} (${p1}%)</span>
              </button>
              <button data-poll-opt="2" class="w-full text-left p-1.5 rounded bg-black/40 hover:bg-cyan-500/20 text-xs relative overflow-hidden ${voted ? "opacity-70 pointer-events-none" : ""}">
                <div class="absolute inset-0 bg-cyan-500/20" style="width:${p2}%"></div><span class="relative">${escapeHtml(msg.poll.opt2)} — ${msg.poll.v2 || 0} (${p2}%)</span>
              </button>`;

      pollDiv.querySelectorAll("[data-poll-opt]").forEach((btn) => {
        btn.onclick = () => votePoll(msg.id, parseInt(btn.dataset.pollOpt));
      });
      bubble.appendChild(pollDiv);
    }

    // Медиа (фото, видео, аудио)

    if (msg.media) {
      const mediaDiv = document.createElement("div");
      mediaDiv.className = "msg-media mt-1";
      mediaDiv.style.padding = "0";
      mediaDiv.style.backgroundColor = "transparent";
      mediaDiv.style.lineHeight = "0";

      // Берем ссылку с сервера
      const mediaSource = msg.media.url;
      if (!mediaSource) return; // Если ссылки нет - пропускаем

      if (msg.media.type === "image") {
        const img = document.createElement("img");
        img.src = mediaSource;
        img.style.border = "2px solid var(--primary-neon)";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.cursor = "pointer";
        img.onclick = () => openMediaViewer(mediaSource, "image");
        mediaDiv.appendChild(img);
      } else if (msg.media.type === "video") {
        const vid = document.createElement("video");
        vid.src = mediaSource;
        vid.controls = true;
        vid.style.maxWidth = "100%";
        vid.style.borderRadius = "8px";
        mediaDiv.appendChild(vid);
      } else if (msg.media.type === "audio") {
        const fmt = (s) => {
          if (!isFinite(s)) return "0:00";
          const m = Math.floor(s / 60);
          const sec = Math.floor(s % 60);
          return `${m}:${sec.toString().padStart(2, "0")}`;
        };

        const w = document.createElement("div");
        w.className = "voice-player-container";

        const btn = document.createElement("button");
        btn.className = "voice-play-btn";
        btn.innerHTML = '<i class="fas fa-play text-sm"></i>';

        const track = document.createElement("div");
        track.className = "voice-waveform";

        const BAR_COUNT = 24; // Чуть меньше баров, чтобы они были толще
        const bars = [];
        const seed = String(msg.id || "1")
          .split("")
          .reduce((a, c) => a + c.charCodeAt(0), 7);

        for (let i = 0; i < BAR_COUNT; i++) {
          const bar = document.createElement("div");
          bar.className = "voice-bar";
          // Генерируем высоту от 6px до 28px
          const pseudo = Math.abs(Math.sin(seed + i * 1.5)) * 0.7 + 0.3;
          bar.style.height = Math.max(6, Math.round(pseudo * 28)) + "px";
          track.appendChild(bar);
          bars.push(bar);
        }

        const meta = document.createElement("div");
        meta.className = "voice-meta";

        const timeEl = document.createElement("span");
        timeEl.className = "voice-time";
        timeEl.textContent = fmt(msg.media.duration || 15);

        const speedBtn = document.createElement("button");
        speedBtn.className = "voice-speed";
        speedBtn.textContent = "1x";

        meta.appendChild(timeEl);
        meta.appendChild(speedBtn);

        const aud = document.createElement("audio");
        aud.src = mediaSource;
        aud.className = "hidden";

        const render = () => {
          const dur = isFinite(aud.duration)
            ? aud.duration
            : msg.media.duration || 15;
          const percent = dur ? aud.currentTime / dur : 0;
          const playedBars = Math.floor(percent * BAR_COUNT);

          bars.forEach((b, i) => {
            if (i < playedBars) b.classList.add("played");
            else b.classList.remove("played");
          });

          // Показываем оставшееся время
          timeEl.textContent = fmt(Math.max(0, dur - aud.currentTime));
        };

        btn.onclick = () => {
          if (aud.paused) {
            // Если играет другое аудио — ставим его на паузу и сбрасываем его UI
            if (currentlyPlayingAudio && currentlyPlayingAudio !== aud) {
              currentlyPlayingAudio.pause();
              // Тут мы вызываем событие, чтобы UI старого плеера вернулся в исходное состояние
              currentlyPlayingAudio.dispatchEvent(new Event("ended"));
            }

            aud.play();
            btn.innerHTML = '<i class="fas fa-pause text-sm"></i>';
            btn.style.paddingLeft = "0";
            track.classList.add("voice-playing");

            // Запоминаем, что играет именно этот трек
            currentlyPlayingAudio = aud;
          } else {
            aud.pause();
            btn.innerHTML = '<i class="fas fa-play text-sm"></i>';
            btn.style.paddingLeft = "2px";
            track.classList.remove("voice-playing");
            currentlyPlayingAudio = null;
          }
        };

        aud.onloadedmetadata = () => {
          if (isFinite(aud.duration)) timeEl.textContent = fmt(aud.duration);
          render();
        };

        aud.ontimeupdate = render;

        aud.onended = () => {
          btn.innerHTML = '<i class="fas fa-play text-sm"></i>';
          btn.style.paddingLeft = "2px";
          track.classList.remove("voice-playing");
          aud.currentTime = 0;
          render();
        };

        track.onclick = (e) => {
          const r = track.getBoundingClientRect();
          const pos = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
          const dur = isFinite(aud.duration)
            ? aud.duration
            : msg.media.duration || 15;
          if (dur) aud.currentTime = pos * dur;
          render();
        };

        speedBtn.onclick = (e) => {
          e.stopPropagation();
          const speeds = [1, 1.5, 2];
          const idx = speeds.indexOf(aud.playbackRate);
          const next = speeds[(idx + 1) % speeds.length];
          aud.playbackRate = next;
          speedBtn.textContent = next + "x";
        };

        w.appendChild(btn);
        w.appendChild(track);
        w.appendChild(meta);
        w.appendChild(aud);
        mediaDiv.appendChild(w);
      } else {
        const a = document.createElement("a");
        a.href = mediaSource;
        a.target = "_blank";
        a.className = "text-cyan-400 underline text-xs flex items-center gap-1";
        a.innerHTML = `<i class="fas fa-file"></i> ${msg.media.name || "file"}`;
        mediaDiv.appendChild(a);
      }
      bubble.appendChild(mediaDiv);
    }
    // Реакции
    if (msg.reactions && Object.keys(msg.reactions).length) {
      const reactRow = document.createElement("div");
      reactRow.className = "flex flex-wrap mt-1";
      Object.entries(msg.reactions).forEach(([emoji, users]) => {
        if (!users || !users.length) return;
        const chip = document.createElement("span");
        chip.className = `reaction-chip ${users.includes(state.currentUser) ? "mine" : ""}`;
        chip.textContent = `${emoji} ${users.length}`;
        chip.onclick = () => toggleReaction(msg.id, emoji);
        reactRow.appendChild(chip);
      });
      bubble.appendChild(reactRow);
    }

    // Ховер-реакции для ПК
    const hoverReact = document.createElement("div");
    hoverReact.className =
      "absolute -top-3 right-0 hidden group-hover:flex items-center gap-1 bg-slate-800 rounded-full px-2 py-1 shadow-lg border border-slate-600";
    ["👍", "🔥", "⚡", "😂", "❤️"].forEach((em) => {
      const b = document.createElement("button");
      b.className = "text-sm hover:scale-125 transition";
      b.textContent = em;
      b.onclick = (e) => {
        e.stopPropagation();
        toggleReaction(msg.id, em);
      };
      hoverReact.appendChild(b);
    });

    // Сборка сообщения
    wrap.appendChild(hoverReact);
    wrap.appendChild(meta);
    wrap.appendChild(bubble);

    // Контекстное меню (ПКМ)
    wrap.oncontextmenu = (e) => showContextMenu(e, msg);
    let pressTimer;
    wrap.addEventListener(
      "touchstart",
      (e) => {
        pressTimer = setTimeout(
          () => showContextMenu(e.touches[0] || e, msg),
          500,
        );
      },
      { passive: true },
    );
    wrap.addEventListener("touchend", () => clearTimeout(pressTimer));
    wrap.addEventListener("touchmove", () => clearTimeout(pressTimer));

    // === СВАЙП ДЛЯ ОТВЕТА ===
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    wrap.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isSwiping = false;
        wrap.style.transition = "none";
      },
      { passive: true },
    );

    wrap.addEventListener(
      "touchmove",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (diff > 0 && diff < 80) {
          isSwiping = true;
          wrap.style.transform = `translateX(${diff}px)`;
        }
      },
      { passive: true },
    );

    wrap.addEventListener("touchend", () => {
      wrap.style.transition = "transform 0.2s ease-out";
      const diff = touchEndX - touchStartX;
      if (isSwiping && diff > 50) {
        state.replyTo = msg;
        const ru = document.getElementById("replyToUser");
        if (ru) ru.textContent = msg.sender;
        const rt = document.getElementById("replyToText");
        if (rt) rt.textContent = msg.text || (msg.media ? "[media]" : "");
        document.getElementById("replyBar")?.classList.remove("hidden");
        if (navigator.vibrate) navigator.vibrate(50);
      }
      wrap.style.transform = "translateX(0)";
      setTimeout(() => {
        wrap.style.transition = "";
        isSwiping = false;
      }, 200);
    });

    // Добавляем на экран
    messageFeedEl.appendChild(wrap);
  }); // <--- ЗДЕСЬ ЗАКРЫВАЕТСЯ ЦИКЛ currentMsgs.forEach

  // 2. ВОССТАНАВЛИВАЕМ СКРОЛЛ
  if (isAtBottom || forceScroll) {
    messageFeedEl.scrollTop = messageFeedEl.scrollHeight;
  } else if (window.isLoadingOlderMessages) {
    // Если мы подгрузили старые сообщения, удерживаем экран на том же месте
    const newScrollHeight = messageFeedEl.scrollHeight;
    messageFeedEl.scrollTop =
      newScrollHeight - prevScrollHeight + prevScrollTop;
    window.isLoadingOlderMessages = false; // Сбрасываем флаг
  }
}
// --- БЕСКОНЕЧНЫЙ СКРОЛЛ ---
let isFetchingHistory = false;

document.addEventListener("DOMContentLoaded", () => {
  const messageFeedEl = document.getElementById("messageFeed");
  if (!messageFeedEl) return;

  messageFeedEl.addEventListener("scroll", () => {
    // Если докрутили до самого верха (меньше 50px)
    if (messageFeedEl.scrollTop < 50 && !isFetchingHistory) {
      const currentMsgs = state.messages[state.activeChatId] || [];
      if (currentMsgs.length === 0) return;

      isFetchingHistory = true;
      window.isLoadingOlderMessages = true; // Флаг для renderMessages

      // Берем ID самого первого (верхнего) сообщения в списке
      const oldestMsgId = currentMsgs[0].id;

      // Отправляем запрос на сервер за старыми сообщениями
      if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
        window.mySocket.send(
          JSON.stringify({
            action: "get_history",
            chatId: state.activeChatId,
            limit: 50,
            beforeId: oldestMsgId, // Говорим серверу: "дай мне то, что было ДО этого ID"
          }),
        );
      }
    }
  });
});

// --- Переключение чата ---
function switchChat(id) {
  state.activeChatId = id;
  const chat = state.chats.find((c) => c.id === id);
  if (chat) chat.unread = 0;

  const nameEl = document.getElementById("activeChatName");
  if (nameEl) nameEl.textContent = chat ? chat.name : id;
  const avatarEl = document.getElementById("activeChatAvatar");
  if (avatarEl) avatarEl.textContent = chat?.type === "channel" ? "#" : "DM";
  const typeEl = document.getElementById("typingStatus");
  if (typeEl) typeEl.textContent = "";

  // Скрываем кнопки звонков в общих каналах
  const isDM = id.startsWith("dm-");
  const audioBtn = document.getElementById("startAudioCallBtn");
  const videoBtn = document.getElementById("startVideoCallBtn");
  if (audioBtn) audioBtn.style.display = isDM ? "block" : "none";
  if (videoBtn) videoBtn.style.display = isDM ? "block" : "none";

  // ❗ ЗАПРАШИВАЕМ ИСТОРИЮ У СЕРВЕРА
  isFetchingHistory = false; // <--- ДОБАВИТЬ ЭТО
  window.isLoadingOlderMessages = false; // <--- И ЭТО
  if (window.mySocket && window.mySocket.readyState === WebSocket.OPEN) {
    window.mySocket.send(
      JSON.stringify({
        action: "get_history",
        chatId: id,
        limit: 50, // Запрашиваем только 50 сообщений
      }),
    );
  }

  renderChatList(document.getElementById("chatSearchInput")?.value || "");
  renderMessages(true);
  saveState();
}
// ==========================================
// ПРОСМОТРЩИК МЕДИА (КАРТИНКИ И ВИДЕО)
// ==========================================
function openMediaViewer(mediaUrl, kind) {
  const viewer = document.getElementById("mediaViewer");
  const img = document.getElementById("mediaViewerImg");
  const vid = document.getElementById("mediaViewerVideo");

  if (!viewer) return;

  // Скрываем всё по умолчанию
  img?.classList.add("hidden");
  vid?.classList.add("hidden");

  // Показываем картинку или видео
  if (kind === "image") {
    if (img) {
      img.src = mediaUrl; // Берем ссылку с сервера
      img.classList.remove("hidden");
    }
  } else {
    if (vid) {
      vid.src = mediaUrl; // Берем ссылку с сервера
      vid.classList.remove("hidden");
    }
  }

  // Показываем само окно
  viewer.classList.remove("hidden");
  viewer.classList.add("flex");
}

// Не забудь экспортировать её!
window.openMediaViewer = openMediaViewer;
window.renderChatList = renderChatList;
window.renderMessages = renderMessages;
window.switchChat = switchChat;

// Делаем функции доступными для других файлов
window.renderChatList = renderChatList;
window.renderMessages = renderMessages;
window.switchChat = switchChat;
// --- АВТО-УВЕЛИЧЕНИЕ ПОЛЯ ВВОДА ---
document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.getElementById("messageInput");
  if (!inputEl) return;

  const resizeInput = () => {
    inputEl.style.height = "auto"; // Сбрасываем высоту
    const maxHeight = 120; // Максимум ~4-5 строк
    inputEl.style.height = Math.min(inputEl.scrollHeight, maxHeight) + "px";

    // Если текст больше лимита — включаем скролл
    inputEl.style.overflowY =
      inputEl.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  // Растет при вводе текста
  inputEl.addEventListener("input", resizeInput);

  // Отправка по Enter, перенос строки по Shift+Enter
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Отменяем перенос строки

      // Ищем форму или кнопку отправки, чтобы имитировать клик
      const sendBtn = document.getElementById("sendBtn");
      if (sendBtn) sendBtn.click();
    }
  });
});
