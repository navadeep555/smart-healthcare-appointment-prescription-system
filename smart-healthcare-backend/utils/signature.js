const crypto = require("crypto");

/* ================= ENCRYPTION CONFIG ================= */
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET || "medicare_secret")
  .digest();

const IV_LENGTH = 16;

/* ================= ENCRYPT ================= */
function encrypt(text) {
  if (!text) return "";

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/* ================= DECRYPT ================= */
function decrypt(text) {
  if (!text) return "";

  try {
    const [ivHex, encryptedText] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.log("DECRYPT ERROR (SAFE IGNORE):", err.message);
    return "";
  }
}

/* ================= DIGITAL SIGNATURE ================= */

// 🔐 SECRET FOR SIGNING (DO NOT CHANGE ONCE DEPLOYED)
const SIGN_SECRET = process.env.SIGN_SECRET || "medicare_sign_secret";

/* CREATE SIGNATURE */
function signData(data) {
  return crypto
    .createHmac("sha256", SIGN_SECRET)
    .update(data)
    .digest("hex");
}

/* VERIFY SIGNATURE */
function verifySignature(data, signature) {
  if (!signature) return false;

  const expected = signData(data);
  return expected === signature;
}

/* ================= EXPORT ================= */
module.exports = {
  encrypt,
  decrypt,
  signData,
  verifySignature
};
