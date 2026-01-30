const express = require("express");
const Doctor = require("../models/Doctor");
const diseaseMap = require("../utils/diseaseMap");

const router = express.Router();

/* ================= ADD DOCTOR (ADMIN / POSTMAN) ================= */
router.post("/add", async (req, res) => {
  try {
    const {
      name,
      email,
      specialization,
      experience,
      hospital,
      availableDays,
      availableSlots
    } = req.body;

    // Validation
    if (!name || !email || !specialization) {
      return res.status(400).json({
        success: false,
        message: "Name, email and specialization are required"
      });
    }

    // Prevent duplicate doctor email
    const exists = await Doctor.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "Doctor already exists with this email"
      });
    }

    const doctor = await Doctor.create({
      name,
      email,
      specialization,
      experience,
      hospital,
      availableDays,
      availableSlots
    });

    res.json({
      success: true,
      message: "Doctor added successfully",
      doctor
    });

  } catch (err) {
    console.error("ADD DOCTOR ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* ================= GET DOCTORS BY DISEASE ================= */
router.get("/by-disease", async (req, res) => {
  try {
    const { disease } = req.query;

    if (!disease) {
      return res.json({ success: false, doctors: [] });
    }

    const key = disease.toLowerCase();
    const specializations = diseaseMap[key] || [];

    let doctors;

    if (specializations.length > 0) {
      doctors = await Doctor.find({
        specialization: { $in: specializations }
      });
    } else {
      doctors = await Doctor.find({
        specialization: { $regex: disease, $options: "i" }
      });
    }

    res.json({ success: true, doctors });

  } catch (err) {
    console.error("FETCH DOCTORS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ================= GET ALL DOCTORS ================= */
router.get("/", async (req, res) => {
  const doctors = await Doctor.find();
  res.json({ success: true, doctors });
});

module.exports = router;
