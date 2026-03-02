console.log("Starting key exchange...");

/* ================= START KEY EXCHANGE ================= */
async function startKeyExchange() {
  try {
    /* STEP 1: Get server public key */
    const res = await fetch(`${BASE_URL}/api/key-exchange/init`);
    const data = await res.json();

    if (!data.success) {
      throw new Error("Failed to get server public key");
    }

    const serverPublicKeyBase64 = data.serverPublicKey;

    /* STEP 2: Generate client key pair (ECDH) */
    const clientKeyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256"
      },
      true,
      ["deriveKey"]
    );

    /* STEP 3: Import server public key using raw format (not atob) */
    const serverPublicKey = await window.crypto.subtle.importKey(
      "raw",
      base64ToArrayBuffer(serverPublicKeyBase64),
      {
        name: "ECDH",
        namedCurve: "P-256"
      },
      true,
      []
    );

    /* STEP 4: Export client public key */
    const clientPublicKeyRaw = await window.crypto.subtle.exportKey(
      "raw",
      clientKeyPair.publicKey
    );

    const clientPublicKeyBase64 = arrayBufferToBase64(clientPublicKeyRaw);

    /* STEP 5: Send client public key to server */
    await fetch(`${BASE_URL}/api/auth/key-exchange/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientPublicKey: clientPublicKeyBase64
      })
    });

    console.log("Key exchange completed successfully");

  } catch (err) {
    console.error("Key exchange failed:", err);
  }
}

/* ================= HELPERS ================= */

// Converts a Base64 string to an ArrayBuffer safely
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Converts an ArrayBuffer to a Base64 string
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/* ================= AUTO START ================= */
startKeyExchange();
