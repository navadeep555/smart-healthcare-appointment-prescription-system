console.log("Starting key exchange...");

let sessionKey = null;

/* ================= CLIENT ECDH ================= */

async function startKeyExchange() {
  // 1️⃣ Generate client ECDH keys
  const clientKeyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey"]
  );

  // 2️⃣ Export client public key (Base64)
  const clientPublicKeyRaw = await crypto.subtle.exportKey(
    "raw",
    clientKeyPair.publicKey
  );

  const clientPublicKeyBase64 = btoa(
    String.fromCharCode(...new Uint8Array(clientPublicKeyRaw))
  );

  // 3️⃣ Get server public key
  const initRes = await fetch("http://localhost:5000/api/key-exchange/init");
  const initData = await initRes.json();

  if (!initData.success) {
    throw new Error("Key exchange init failed");
  }

  const serverPublicKeyBase64 = initData.serverPublicKey;

  // 4️⃣ Import server public key
  const serverPublicKeyRaw = Uint8Array.from(
    atob(serverPublicKeyBase64),
    c => c.charCodeAt(0)
  );

  const serverPublicKey = await crypto.subtle.importKey(
    "raw",
    serverPublicKeyRaw,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    false,
    []
  );

  // 5️⃣ Derive shared AES key
  sessionKey = await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: serverPublicKey
    },
    clientKeyPair.privateKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );

  // 6️⃣ Send client public key to server
  await fetch("http://localhost:5000/api/key-exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientPublicKey: clientPublicKeyBase64
    })
  });

  console.log("Key exchange completed successfully");
}

function getSessionKey() {
  return sessionKey;
}

export { startKeyExchange, getSessionKey };
