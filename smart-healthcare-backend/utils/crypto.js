const crypto = require("crypto");

/* ===================================================== */
/* ========== 🔒 STATIC AES (ORIGINAL – KEPT) 🔒 ======== */
/* ===================================================== */

const SECRET_KEY = crypto
  .createHash("sha256")
  .update("medicare-secret-key")
  .digest(); // 32 bytes

const IV = Buffer.alloc(16, 0);

/* ================= STATIC ENCRYPT ================= */
function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/* ================= STATIC DECRYPT ================= */
function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/* ================= SIGN ================= */
function signData(data) {
  return crypto
    .createHmac("sha256", "medicare-sign-key")
    .update(data)
    .digest("hex");
}

/* ================= VERIFY ================= */
function verifySignature(data, signature) {
  const expected = signData(data);
  return expected === signature;
}

/* ===================================================== */
/* ========== 🔑 DIFFIE–HELLMAN KEY EXCHANGE 🔑 ========= */
/* ===================================================== */

let dhInstance = null;
let sharedSessionKey = null;

/* ================= GENERATE DH KEYS ================= */
function generateDHKeys() {
  dhInstance = crypto.createDiffieHellman(2048);
  const publicKey = dhInstance.generateKeys("hex");

  return {
    prime: dhInstance.getPrime("hex"),
    generator: dhInstance.getGenerator("hex"),
    publicKey
  };
}

/* ================= COMPUTE SHARED KEY ================= */
function computeSharedKey(clientPublicKeyHex) {
  if (!dhInstance) {
    throw new Error("DH keys not initialized");
  }

  const sharedSecret = dhInstance.computeSecret(
    clientPublicKeyHex,
    "hex",
    "hex"
  );

  sharedSessionKey = crypto
    .createHash("sha256")
    .update(sharedSecret)
    .digest(); // 32 bytes AES key

  return sharedSessionKey.toString("hex");
}

/* ===================================================== */
/* ========== 🔐 SESSION AES (WITH FALLBACK) 🔐 ========= */
/* ===================================================== */

/*
  ✅ Uses session key if available
  ✅ Falls back to static AES if not
  ✅ Prevents runtime crash
*/

/* ================= SESSION ENCRYPT ================= */
function encryptWithSessionKey(text) {
  if (!sharedSessionKey) {
    // ✅ FALLBACK (IMPORTANT FIX)
    return encrypt(text);
  }

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    sharedSessionKey,
    IV
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/* ================= SESSION DECRYPT ================= */
function decryptWithSessionKey(encryptedText) {
  if (!sharedSessionKey) {
    return decrypt(encryptedText);
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    sharedSessionKey,
    IV
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/* ===================================================== */
/* ===================== EXPORTS ======================== */
/* ===================================================== */

module.exports = {
  // Static AES
  encrypt,
  decrypt,

  // Integrity
  signData,
  verifySignature,

  // Key Exchange
  generateDHKeys,
  computeSharedKey,

  // Session AES
  encryptWithSessionKey,
  decryptWithSessionKey
};
