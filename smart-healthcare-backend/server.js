require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

/* ================= 🔐 CRYPTO (DIFFIE–HELLMAN) ================= */
const {
  generateDHKeys,
  computeSharedKey
} = require("./utils/crypto");

/* ================= APP ================= */
const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

/* ===================================================== */
/* ============ 🔐 DIFFIE–HELLMAN KEY EXCHANGE ========== */
/* ===================================================== */

/*
  STEP 1:
  Client requests server public key + parameters
*/
app.get("/api/crypto/key-exchange/init", (req, res) => {
  try {
    const dhData = generateDHKeys();

    res.json({
      success: true,
      prime: dhData.prime,
      generator: dhData.generator,
      serverPublicKey: dhData.publicKey
    });

  } catch (err) {
    console.error("❌ DH INIT ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Key exchange initialization failed"
    });
  }
});

/*
  STEP 2:
  Client sends its public key
*/
app.post("/api/crypto/key-exchange/complete", (req, res) => {
  try {
    const { clientPublicKey } = req.body;

    if (!clientPublicKey) {
      return res.status(400).json({
        success: false,
        message: "Client public key required"
      });
    }

    computeSharedKey(clientPublicKey);

    res.json({
      success: true,
      message: "Secure session key established"
    });

  } catch (err) {
    console.error("❌ DH COMPLETE ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Key exchange failed"
    });
  }
});

/* ================= TEST ================= */
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from server" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
