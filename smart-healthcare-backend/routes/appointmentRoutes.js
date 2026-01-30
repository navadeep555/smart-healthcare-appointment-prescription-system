const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const {
  encrypt,
  decrypt,
  signData,
  verifySignature,
  encryptWithSessionKey, 
  decryptWithSessionKey  
} = require("../utils/crypto");

const { encodeBase64, decodeBase64 } = require("../utils/encoding"); 
const PDFDocument = require("pdfkit");
const verifyToken = require("../middleware/verifyToken"); 

const router = express.Router();

/* ================= BOOK APPOINTMENT ================= */
router.post("/book", async (req, res) => {
  try {
    const { patientName, patientEmail, doctorId, date, time, disease } = req.body;

    if (!patientName || !patientEmail || !doctorId || !date || !time) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const appointment = await Appointment.create({
      patientName,
      patientEmail,
      doctor: doctor._id,
      date,
      time,
      disease,
      status: "Booked"
    });

    res.json({
      success: true,
      message: "Appointment booked successfully",
      appointment
    });

  } catch (err) {
    console.error("BOOK ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= PATIENT APPOINTMENTS ================= */
router.get("/my/:email", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientEmail: req.params.email,
      status: { $ne: "Cancelled" }
    })
      .populate("doctor")
      .sort({ createdAt: -1 });

    appointments.forEach(app => {
      app.encodedId = encodeBase64(app._id.toString());
      app._doc.encodedId = app.encodedId;


      if (app.prescription) {
        if (app.prescription.isRevoked) {
          app.prescription = { isRevoked: true };
          return;
        }

        try {
          const diagnosis = decryptWithSessionKey(app.prescription.diagnosis) || "";
          const medicines = decryptWithSessionKey(app.prescription.medicines) || "";
          const advice = app.prescription.advice
            ? decryptWithSessionKey(app.prescription.advice)
            : "";

          const isValid = verifySignature(
            `${diagnosis}${medicines}${advice}${app._id}`,
            app.prescription.signature
          );

          app.prescription.diagnosis = diagnosis;
          app.prescription.medicines = medicines;
          app.prescription.advice = advice;
          app.prescription.isValid = isValid;

        } catch {
          app.prescription.isValid = false;
        }
      }
    });

    res.json({ success: true, appointments });

  } catch (err) {
    console.error("FETCH PATIENT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= DOCTOR APPOINTMENTS ================= */
router.get("/doctor/:value", async (req, res) => {
  try {
    let doctorId;
    const value = req.params.value;

    if (mongoose.Types.ObjectId.isValid(value)) {
      doctorId = value;
    } else {
      const doctor = await Doctor.findOne({ email: value });
      if (!doctor) return res.json({ success: true, appointments: [] });
      doctorId = doctor._id;
    }

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("doctor")
      .sort({ createdAt: -1 });

    appointments.forEach(app => {
      app.encodedId = encodeBase64(app._id.toString());
      app._doc.encodedId = app.encodedId;


      if (app.prescription) {
        if (app.prescription.isRevoked) {
          app.prescription.isEditable = false;
          return;
        }

        try {
          const diagnosis = decryptWithSessionKey(app.prescription.diagnosis) || "";
          const medicines = decryptWithSessionKey(app.prescription.medicines) || "";
          const advice = app.prescription.advice
            ? decryptWithSessionKey(app.prescription.advice)
            : "";

          const isValid = verifySignature(
            `${diagnosis}${medicines}${advice}${app._id}`,
            app.prescription.signature
          );

          app.prescription.diagnosis = diagnosis;
          app.prescription.medicines = medicines;
          app.prescription.advice = advice;
          app.prescription.isValid = isValid;
          app.prescription.isEditable = true;

        } catch {
          app.prescription.isValid = false;
        }
      }
    });

    res.json({ success: true, appointments });

  } catch (err) {
    console.error("FETCH DOCTOR ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= CANCEL APPOINTMENT ================= */
router.put("/cancel/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.json({ success: true, message: "Appointment cancelled successfully" });

  } catch (err) {
    console.error("CANCEL ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= ADD PRESCRIPTION ================= */
router.post("/prescription/:id", async (req, res) => {
  try {
    const { diagnosis, medicines, advice } = req.body;

    if (!diagnosis || !medicines) {
      return res.json({
        success: false,
        message: "Diagnosis and medicines are required"
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointment.prescription?.isRevoked) {
      return res.json({
        success: false,
        message: "Prescription revoked by admin"
      });
    }

    const signature = signData(
      `${diagnosis}${medicines}${advice || ""}${appointment._id}`
    );

    appointment.prescription = {
      diagnosis: encryptWithSessionKey(diagnosis),
      medicines: encryptWithSessionKey(medicines),
      advice: advice ? encryptWithSessionKey(advice) : "",
      signature,
      createdAt: new Date()
    };

    appointment.status = "Completed";
    await appointment.save();

    res.json({ success: true, message: "Prescription added successfully" });

  } catch (err) {
    console.error("PRESCRIPTION ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= DOWNLOAD PRESCRIPTION PDF ================= */
router.get("/prescription/pdf/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctor");

    if (!appointment || !appointment.prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    if (appointment.prescription.isRevoked) {
      return res.status(403).json({
        success: false,
        message: "Prescription revoked by admin"
      });
    }

    const diagnosis = decryptWithSessionKey(appointment.prescription.diagnosis);
    const medicines = decryptWithSessionKey(appointment.prescription.medicines);
    const advice = appointment.prescription.advice
      ? decryptWithSessionKey(appointment.prescription.advice)
      : "—";

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription_${appointment.patientName}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(20).text("MediCare Prescription", { align: "center" }).moveDown();
    doc.text(`Patient: ${appointment.patientName}`);
    doc.text(`Doctor: ${appointment.doctor.name}`).moveDown();
    doc.text("Diagnosis:").text(diagnosis).moveDown();
    doc.text("Medicines:").text(medicines).moveDown();
    doc.text("Advice:").text(advice).moveDown();
    doc.end();

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= PDF USING ENCODED ID ================= */
router.get("/prescription/pdf/encoded/:encodedId", async (req, res) => {
  try {
    const decodedId = decodeBase64(req.params.encodedId); 

    const appointment = await Appointment.findById(decodedId)
      .populate("doctor");

    if (!appointment || !appointment.prescription) {
      return res.status(404).json({ success: false, message: "Prescription not found" });
    }

    const diagnosis = decryptWithSessionKey(appointment.prescription.diagnosis);
    const medicines = decryptWithSessionKey(appointment.prescription.medicines);
    const advice = appointment.prescription.advice
      ? decryptWithSessionKey(appointment.prescription.advice)
      : "—";

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=prescription_${appointment.patientName}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(20).text("MediCare Prescription", { align: "center" }).moveDown();
    doc.text(`Patient: ${appointment.patientName}`);
    doc.text(`Doctor: ${appointment.doctor.name}`).moveDown();
    doc.text("Diagnosis:").text(diagnosis).moveDown();
    doc.text("Medicines:").text(medicines).moveDown();
    doc.text("Advice:").text(advice).moveDown();
    doc.end();

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= ADMIN: PRESCRIPTION AUDIT ================= */
router.get("/admin/prescriptions", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false });
    }

    const records = await Appointment.find({
      prescription: { $exists: true }
    }).populate("doctor");

    res.json({
      success: true,
      prescriptions: records.map(r => ({
        patientName: r.patientName,
        doctorName: r.doctor.name,
        date: r.createdAt,
        isValid: !!r.prescription?.signature,
        isRevoked: r.prescription?.isRevoked || false
      }))
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
