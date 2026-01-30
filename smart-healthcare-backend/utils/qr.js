const QRCode = require("qrcode");

/* ================= GENERATE QR ================= */
async function generateQR(text) {
  return await QRCode.toDataURL(text); // Base64 PNG
}

module.exports = { generateQR };
