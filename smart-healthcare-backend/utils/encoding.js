/* ===================================== */
/* ===== BASE64 ENCODING / DECODING ===== */
/* ===================================== */

/*
  Purpose:
  - Safe transmission of IDs
  - Demonstrates Encoding & Decoding
  - NOT encryption
*/

function encodeBase64(data) {
  return Buffer.from(data.toString()).toString("base64");
}

function decodeBase64(encodedData) {
  return Buffer.from(encodedData, "base64").toString("utf8");
}

module.exports = {
  encodeBase64,
  decodeBase64
};
