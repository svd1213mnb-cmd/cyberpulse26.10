/* ==========================================================================
      27. ПАТЧ: ВОЗВРАЩЕНИЕ УПУЩЕННЫХ ФУНКЦИЙ
      ========================================================================== */

// 1. ВОЗВРАЩАЕМ CRYPTOENGINE (ECDH)
const CryptoEngine = {
  keyPair: null,
  async generateKeyPair() {
    try {
      this.keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"],
      );
      return this.keyPair;
    } catch (e) {
      console.warn("Crypto error:", e);
      return null;
    }
  },
  async exportPublicKey() {
    if (!this.keyPair) await this.generateKeyPair();
    if (!this.keyPair) return "Error: Crypto not available";
    const exported = await window.crypto.subtle.exportKey(
      "raw",
      this.keyPair.publicKey,
    );
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  },
};
// Генерируем ключи при старте
CryptoEngine.generateKeyPair().catch(() => {});
