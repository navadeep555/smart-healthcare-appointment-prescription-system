const express = require("express");
const router = express.Router();
const {
  getServerPublicKey,
  deriveSharedSecret
} = require("../utils/keyExchange");

router.post("/key-exchange", (req, res) => {
  try {
    const { clientPublicKey } = req.body;

    if (!clientPublicKey) {
      return res.status(400).json({ error: "Client public key missing" });
    }

    // Derive shared key (not stored)
    deriveSharedSecret(clientPublicKey);

    // Send server public key to client
    res.json({
      serverPublicKey: getServerPublicKey()
    });

  } catch (err) {
    console.error("Key exchange error:", err);
    res.status(500).json({ error: "Key exchange failed" });
  }
});

module.exports = router;
