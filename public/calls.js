// ==========================================
// МОДУЛЬ ЗВОНКОВ (WebRTC) — УЛУЧШЕННАЯ ВЕРСИЯ
// ==========================================

let localStream = null;
let peerConnection = null;
let currentCallUser = null;
let pendingOffer = null;
let iceCandidatesQueue = [];
let isVideoCall = false;
let callTimeout = null;
let callState = "idle"; // idle | ringing | connecting | active

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

// ======================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================

function updateCallUI(state) {
  callState = state;
  const overlay = document.getElementById("callOverlay");
  const videoContainer = document.getElementById("videoCallContainer");
  const audioContainer = document.getElementById("audioCallContainer");
  const switchBtn = document.getElementById("switchToVideoBtn");

  if (!overlay) return;

  if (state === "idle") {
    overlay.classList.add("hidden");
    overlay.classList.remove("flex");
    return;
  }

  overlay.classList.remove("hidden");
  overlay.classList.add("flex");

  if (isVideoCall) {
    videoContainer?.classList.remove("hidden");
    videoContainer?.classList.add("block");
    audioContainer?.classList.add("hidden");
    switchBtn?.classList.add("hidden");
  } else {
    videoContainer?.classList.add("hidden");
    audioContainer?.classList.remove("hidden");
    audioContainer?.classList.add("flex");
    switchBtn?.classList.remove("hidden");
  }
}

function cleanupCall() {
  if (callTimeout) {
    clearTimeout(callTimeout);
    callTimeout = null;
  }

  if (peerConnection) {
    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  const localVideo = document.getElementById("local-video");
  const remoteVideo = document.getElementById("remote-video");
  if (localVideo) localVideo.srcObject = null;
  if (remoteVideo) remoteVideo.srcObject = null;

  iceCandidatesQueue = [];
  pendingOffer = null;
  currentCallUser = null;
  isVideoCall = false;
  callState = "idle";

  updateCallUI("idle");
  document.getElementById("incomingCallModal")?.classList.add("hidden");
}

function createPeerConnection() {
  const pc = new RTCPeerConnection(rtcConfig);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal("ice_candidate", event.candidate);
    }
  };

  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("Connection state:", pc.connectionState);
    if (pc.connectionState === "connected") {
      callState = "active";
      if (typeof toast === "function")
        toast("Соединение установлено", "success");
    }
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      if (callState !== "idle") {
        if (typeof toast === "function") toast("Соединение потеряно", "error");
        endCall(false);
      }
    }
  };

  return pc;
}

// ======================
// ОСНОВНЫЕ ФУНКЦИИ
// ======================

async function startCall(targetUser, video = false) {
  if (callState !== "idle") {
    toast("Уже идёт звонок", "error");
    return;
  }

  try {
    currentCallUser = targetUser;
    isVideoCall = video;
    callState = "connecting";

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video,
    });

    updateCallUI("connecting");

    const localVideo = document.getElementById("local-video");
    if (localVideo && video) localVideo.srcObject = localStream;

    const audioName = document.getElementById("audioCallName");
    if (audioName) audioName.textContent = targetUser;

    peerConnection = createPeerConnection();
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    sendSignal("call_offer", {
      sdp: offer,
      isVideo: video,
    });

    callTimeout = setTimeout(() => {
      if (callState === "connecting") {
        toast("Абонент не отвечает", "error");
        endCall(true);
      }
    }, 45000);

    toast("Вызов отправлен...", "success");
  } catch (err) {
    console.error(err);
    toast("Нет доступа к камере/микрофону", "error");
    cleanupCall();
  }
}

async function receiveCall(fromUser, data) {
  // ❗ ЗАЩИТА ОТ RENEGOTIATION (Включение видео во время активного звонка)
  if (callState === "active" && currentCallUser === fromUser) {
    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.sdp || data),
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      sendSignal("call_answer", answer);
    } catch (e) {
      console.error("Ошибка обновления видео:", e);
    }
    return;
  }

  if (callState !== "idle") {
    sendSignal("call_declined", null, fromUser);
    return;
  }

  currentCallUser = fromUser;
  pendingOffer = data.sdp || data;
  isVideoCall = data.isVideo === true;

  const callerName = document.getElementById("callerName");
  if (callerName) callerName.textContent = fromUser;

  document.getElementById("incomingCallModal")?.classList.remove("hidden");
  callState = "ringing";

  callTimeout = setTimeout(() => {
    if (callState === "ringing") {
      declineCall();
      toast("Пропущенный звонок", "error");
    }
  }, 40000);
}

async function acceptCall() {
  if (!pendingOffer) return;

  clearTimeout(callTimeout);
  document.getElementById("incomingCallModal")?.classList.add("hidden");

  try {
    callState = "connecting";
    updateCallUI("connecting");

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideoCall,
    });

    const localVideo = document.getElementById("local-video");
    if (localVideo && isVideoCall) localVideo.srcObject = localStream;

    peerConnection = createPeerConnection();
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(pendingOffer),
    );

    while (iceCandidatesQueue.length > 0) {
      const c = iceCandidatesQueue.shift();
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {}
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    sendSignal("call_answer", answer);
  } catch (err) {
    console.error(err);
    toast("Не удалось принять звонок", "error");
    endCall(true);
  }
}

function declineCall() {
  sendSignal("call_declined", null);
  cleanupCall();
}

async function handleAnswer(answer) {
  if (!peerConnection) return;

  clearTimeout(callTimeout);

  try {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer),
    );

    while (iceCandidatesQueue.length > 0) {
      const c = iceCandidatesQueue.shift();
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {}
    }

    callState = "active";
    toast("Собеседник ответил", "success");
  } catch (err) {
    console.error(err);
  }
}

async function handleIceCandidate(candidate) {
  if (!peerConnection) {
    iceCandidatesQueue.push(candidate);
    return;
  }

  if (!peerConnection.remoteDescription) {
    iceCandidatesQueue.push(candidate);
  } else {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn("ICE error", e);
    }
  }
}

function endCall(sendSignalToPeer = true) {
  if (sendSignalToPeer && currentCallUser) {
    sendSignal("call_ended", null);
  }
  cleanupCall();
  if (typeof toast === "function") toast("Звонок завершён", "success");
}

function sendSignal(action, data, toUser = null) {
  if (
    typeof mySocket !== "undefined" &&
    mySocket &&
    mySocket.readyState === WebSocket.OPEN
  ) {
    mySocket.send(
      JSON.stringify({
        action,
        to: toUser || currentCallUser,
        data,
      }),
    );
  }
}

// ======================
// КНОПКИ ИНТЕРФЕЙСА
// ======================

document.getElementById("startVideoCallBtn")?.addEventListener("click", () => {
  if (!window.state?.activeChatId?.startsWith("dm-")) {
    return toast("Звонки только в личных сообщениях", "error");
  }
  const chat = window.state.chats.find(
    (c) => c.id === window.state.activeChatId,
  );
  if (chat) startCall(chat.name, true);
});

document.getElementById("startAudioCallBtn")?.addEventListener("click", () => {
  if (!window.state?.activeChatId?.startsWith("dm-")) {
    return toast("Звонки только в личных сообщениях", "error");
  }
  const chat = window.state.chats.find(
    (c) => c.id === window.state.activeChatId,
  );
  if (chat) startCall(chat.name, false);
});

document.getElementById("endCallBtn")?.addEventListener("click", () => {
  endCall(true);
});

document.getElementById("toggleAudioBtn")?.addEventListener("click", () => {
  if (!localStream) return;
  const track = localStream.getAudioTracks()[0];
  if (!track) return;

  track.enabled = !track.enabled;
  const btn = document.getElementById("toggleAudioBtn");
  if (btn) {
    btn.innerHTML = track.enabled
      ? '<i class="fas fa-microphone"></i>'
      : '<i class="fas fa-microphone-slash"></i>';
  }
});

document
  .getElementById("toggleVideoBtn")
  ?.addEventListener("click", async () => {
    if (!localStream || !peerConnection) return;

    const videoTrack = localStream.getVideoTracks()[0];

    if (!videoTrack) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const newTrack = stream.getVideoTracks()[0];

        localStream.addTrack(newTrack);
        peerConnection.addTrack(newTrack, localStream);

        isVideoCall = true;
        updateCallUI("active");

        const localVideo = document.getElementById("local-video");
        if (localVideo) localVideo.srcObject = localStream;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignal("call_offer", { sdp: offer, isVideo: true });

        toast("Видео включено", "success");
      } catch (e) {
        toast("Не удалось включить камеру", "error");
      }
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;
    const btn = document.getElementById("toggleVideoBtn");
    if (btn) {
      btn.innerHTML = videoTrack.enabled
        ? '<i class="fas fa-video"></i>'
        : '<i class="fas fa-video-slash"></i>';
    }
  });

// Экспорт для socket.js
window.startCall = startCall;
window.receiveCall = receiveCall;
window.acceptCall = acceptCall;
window.declineCall = declineCall;
window.handleAnswer = handleAnswer;
window.handleIceCandidate = handleIceCandidate;
window.endCall = endCall;
