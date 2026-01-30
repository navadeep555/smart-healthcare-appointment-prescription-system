require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");          
const User = require("../models/User");

const router = express.Router();

/* ================= KEY EXCHANGE IMPORT (ADDED) ================= */
const {
  generateDHKeys,
  computeSharedKey
} = require("../utils/crypto"); 

/* ================= EMAIL SETUP ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    /* 🔒 ONLY ONE ADMIN ALLOWED */
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.json({
          success: false,
          message: "Admin already exists. Only one admin is allowed."
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.json({ success: true, message: "Registration successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= LOGIN → SEND OTP ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Please register first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    try {
      await transporter.sendMail({
        from: `"Smart Healthcare" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your OTP - Smart Healthcare",
        html: `
          <h2>OTP Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        `
      });
    } catch (emailErr) {
      console.warn("⚠️ EMAIL FAILED — CONTINUING LOGIN");
    }

    res.json({
      success: true,
      message: "OTP sent to email",
      email: user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= RESEND OTP ================= */
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    try {
      await transporter.sendMail({
        from: `"Smart Healthcare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Resent OTP - Smart Healthcare",
        html: `
          <h2>OTP Verification</h2>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        `
      });
    } catch (emailErr) {
      console.warn("⚠️ EMAIL FAILED — CONTINUING");
    }

    res.json({ success: true, message: "OTP resent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= VERIFY OTP (JWT FIX) ================= */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json({ success: false, message: "Email and OTP required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.json({ success: false, message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    /* JWT TOKEN GENERATED HERE */
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ===================================================== */
/* ============ KEY EXCHANGE APIs (ADDED) ============= */
/* ===================================================== */

/* STEP 1: Client requests server public key */
router.get("/key-exchange/init", (req, res) => {
  try {
    const dh = generateDHKeys();

    res.json({
      success: true,
      prime: dh.prime,
      generator: dh.generator,
      serverPublicKey: dh.publicKey
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Key exchange initialization failed"
    });
  }
});

/* STEP 2: Client sends its public key */
router.post("/key-exchange/complete", (req, res) => {
  try {
    const { clientPublicKey } = req.body;

    if (!clientPublicKey) {
      return res.json({
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
    res.status(500).json({
      success: false,
      message: "Key exchange failed"
    });
  }
});

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Email not registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    try {
      await transporter.sendMail({
        from: `"Smart Healthcare" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset OTP - Smart Healthcare",
        html: `
          <h2>Password Reset</h2>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes.</p>
        `
      });
    } catch (emailErr) {
      console.warn("⚠️ EMAIL FAILED — CONTINUING");
    }

    res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.json({ success: false, message: "All fields required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.json({ success: false, message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
