// ==========================================
// notifications.js - СИСТЕМА УВЕДОМЛЕНИЙ
// ==========================================

window.requestNotificationPermission = function () {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};

window.showSystemNotification = function (title, body, isCall = false) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    const notif = new Notification(title, {
      body: body,
      icon: "logo.png",
      requireInteraction: isCall, // Для звонков висит, пока не закроют
      tag: isCall ? "incoming-call" : "new-message",
    });

    notif.onclick = () => {
      window.focus();
    };
  }
};
