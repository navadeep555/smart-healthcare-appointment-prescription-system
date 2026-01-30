const express = require("express");
const Doctor = require("../models/Doctor");
const verifyToken = require("../middleware/verifyToken"); 

const router = express.Router();

/* ================= ADD DOCTOR (ADMIN) ================= */
router.post("/add-doctor", verifyToken, async (req, res) => { 
  try {

    
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    const {
      name,
      specialization,
      experience,
      hospital,
      availableDays,
      availableSlots
    } = req.body;

    // Basic validation
    if (!name || !specialization) {
      return res.json({
        success: false,
        message: "Name and specialization are required"
      });
    }

    const doctor = await Doctor.create({
      name,
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
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ================= GET USERS STATS (ADMIN) ================= */
const User = require("../models/User");                
const Appointment = require("../models/Appointment"); 

router.get("/users", verifyToken, async (req, res) => { 
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const total = await User.countDocuments();
    const doctors = await User.countDocuments({ role: "doctor" });
    const patients = await User.countDocuments({ role: "patient" });

    res.json({
      success: true,
      total,
      doctors,
      patients
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= GET APPOINTMENTS COUNT (ADMIN) ================= */
router.get("/appointments", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const total = await Appointment.countDocuments();

    res.json({
      success: true,
      total
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= PRESCRIPTION AUDIT (ADMIN) ================= */
router.get("/prescriptions", verifyToken, async (req, res) => { 
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const records = await Appointment.find({ prescription: { $exists: true } })
      .populate("patientId", "name")
      .populate("doctorId", "name");

    const prescriptions = records.map(r => ({
      patientName: r.patientId?.name || "N/A",
      doctorName: r.doctorId?.name || "N/A",
      date: r.createdAt,
      isValid: !!r.signature
    }));

    res.json({
      success: true,
      prescriptions
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= PRESCRIPTION AUDIT v2 (ADMIN - FIXED) ================= */
router.get("/prescriptions-v2", verifyToken, async (req, res) => { 
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const records = await Appointment.find({
      prescription: { $exists: true }
    }).populate("doctor", "name");

    res.json({
      success: true,
      prescriptions: records.map(r => ({
        _id: r._id, 
        patientName: r.patientName,
        doctorName: r.doctor?.name || "N/A",
        date: r.createdAt,
        isValid: !!r.prescription?.signature,
        isRevoked: r.prescription?.isRevoked || false 
      }))
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= USERS STATS v2 (ADMIN - FIXED) ================= */
router.get("/users-v2", verifyToken, async (req, res) => { 
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const patients = await User.countDocuments({ role: "patient" });
    const doctors = await Doctor.countDocuments(); 
    const total = patients + doctors + 1; // +1 admin

    res.json({
      success: true,
      total,
      doctors,
      patients
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= APPOINTMENTS COUNT v2 (ADMIN - FIXED) ================= */
router.get("/appointments-v2", verifyToken, async (req, res) => { 
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const total = await Appointment.countDocuments({
      status: { $ne: "Cancelled" }
    });

    res.json({
      success: true,
      total
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= REMOVE DOCTOR (ADMIN) ================= */
router.delete("/doctor/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    await Doctor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Doctor removed successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= REMOVE PATIENT (ADMIN) ================= */
router.delete("/patient/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Patient removed successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= REVOKE PRESCRIPTION (ADMIN) ================= */
router.put("/prescription/revoke/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.prescription) {
      return res.json({ success: false, message: "Prescription not found" });
    }

  
    appointment.prescription.revoked = true;

    
    appointment.prescription.isRevoked = true;
    appointment.prescription.signature = null;
    appointment.prescription.revokedBy = req.user.id;
    appointment.prescription.revokedAt = Date.now();

    await appointment.save();

    res.json({
      success: true,
      message: "Prescription revoked by admin"
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
