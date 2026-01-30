// cryptoClient.js (CLIENT SIDE)

import { getSessionKey } from "./keyExchange.js";

// Encrypt data
async function encryptData(plainText) {
    const key = getSessionKey();
    if (!key) throw new Error("Session key not established");

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(plainText);

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedData
    );

    return {
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
}

// Decrypt data
async function decryptData(encryptedPayload) {
    const key = getSessionKey();
    if (!key) throw new Error("Session key not established");

    const iv = Uint8Array.from(atob(encryptedPayload.iv), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(
        atob(encryptedPayload.data),
        c => c.charCodeAt(0)
    );

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decrypted);
}

export { encryptData, decryptData };
