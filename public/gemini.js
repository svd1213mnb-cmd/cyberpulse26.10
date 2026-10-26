/* ==========================================================================
       18. GEMINI AI
       ========================================================================== */
const aiDrawer = document.getElementById("aiDrawer");

document
  .getElementById("openAiDrawerBtn")
  ?.addEventListener("click", () => aiDrawer?.classList.toggle("hidden"));
document
  .getElementById("closeAiDrawerBtn")
  ?.addEventListener("click", () => aiDrawer?.classList.add("hidden"));

// Запрос к Google API
// Функция роботизированной озвучки
function speakRobot(text) {
  if (!window.speechSynthesis) return; // Если браузер не поддерживает
  if (!SoundEngine.isEnabled()) return; // Если звуки выключены в настройках

  // Убираем Markdown-символы (звездочки, решетки), чтобы робот их не читал
  const cleanText = text.replace(/[*_`#]/g, "");

  // Останавливаем предыдущую озвучку, если она еще говорит
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Делаем голос роботизированным
  utterance.pitch = 0.6; // Понижаем тон (от 0 до 2)
  utterance.rate = 1.1; // Немного ускоряем темп (от 0.1 до 10)

  // Ищем подходящий голос (сначала русский, потом английский)
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice =
    voices.find((v) => v.lang.includes("ru")) ||
    voices.find((v) => v.lang.includes("en"));
  if (selectedVoice) utterance.voice = selectedVoice;

  window.speechSynthesis.speak(utterance);
}
async function callGemini(
  prompt,
  system = "Ты — AI-компаньон в киберпанк-мессенджере CYBER_PULSE. Отвечай кратко, технично, с лёгким юмором. На русском.",
) {
  const key = loadSettings().geminiKey;
  if (!key) {
    toast("Введите Gemini API key в настройках", "error");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // Таймаут 30 сек

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      },
    );

    clearTimeout(timeout);
    if (!res.ok) throw new Error("API Error");

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Пусто";
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === "AbortError") toast("Таймаут запроса к Gemini", "error");
    else toast("Ошибка Gemini. Проверьте ключ.", "error");
    return null;
  }
}

// Обычный чат с ИИ
document.getElementById("aiForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("aiInput");
  const val = input.value.trim();
  if (!val) return;

  const aiFeed = document.getElementById("aiFeed");
  if (aiFeed)
    aiFeed.innerHTML += `<div class="p-2 rounded bg-cyan-950/40 text-cyan-200"><strong>Operator:</strong> ${escapeHtml(val)}</div>`;
  input.value = "";
  if (aiFeed) aiFeed.scrollTop = aiFeed.scrollHeight;

  const answer = await callGemini(val);
  if (answer && aiFeed) {
    aiFeed.innerHTML += `<div class="p-2 rounded bg-slate-900 text-slate-300 border border-slate-800"><strong class="text-cyan-400">GEMINI_AI:</strong> ${escapeHtml(answer).replace(/\n/g, "<br>")}</div>`;
    aiFeed.scrollTop = aiFeed.scrollHeight;
    SoundEngine.playReceive();
    SoundEngine.speak(answer);
  }
});
/////чтоб видел////////
window.speakRobot = speakRobot;
window.callGemini = callGemini;
