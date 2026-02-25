const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const {
  encrypt,
  decrypt,
  signData,
  verifySignature
} = require("../utils/crypto");

const { encodeBase64, decodeBase64 } = require("../utils/encoding");
const { generateQR } = require("../utils/qr");
const PDFDocument = require("pdfkit");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

/* ================= SAFE DECRYPT HELPER ================= */
// Returns empty string on failure instead of throwing,
// preventing stale/session-key ciphertext from breaking verification.
function safeDecrypt(text) {
  if (!text) return "";
  try {
    return decrypt(text) || "";
  } catch {
    return "";
  }
}

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
          const diagnosis = safeDecrypt(app.prescription.diagnosis);
          const medicines = safeDecrypt(app.prescription.medicines);
          const advice = safeDecrypt(app.prescription.advice);

          const isValid = verifySignature(
            `${diagnosis}${medicines}${advice}${app._id.toString()}`,
            app.prescription.signature
          );

          app._doc.prescription = {
            diagnosis,
            medicines,
            advice,
            isValid,
            isRevoked: app.prescription.isRevoked || false
          };

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
          const diagnosis = safeDecrypt(app.prescription.diagnosis);
          const medicines = safeDecrypt(app.prescription.medicines);
          const advice = safeDecrypt(app.prescription.advice);

          const isValid = verifySignature(
            `${diagnosis}${medicines}${advice}${app._id.toString()}`,
            app.prescription.signature
          );

          app._doc.prescription = {
            diagnosis,
            medicines,
            advice,
            isValid,
            isEditable: true,
            isRevoked: app.prescription.isRevoked || false
          };

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
      `${diagnosis}${medicines}${advice || ""}${appointment._id.toString()}`
    );

    appointment.prescription = {
      diagnosis: encrypt(diagnosis),
      medicines: encrypt(medicines),
      advice: advice ? encrypt(advice) : "",
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

    const diagnosis = decrypt(appointment.prescription.diagnosis);
    const medicines = decrypt(appointment.prescription.medicines);
    const advice = appointment.prescription.advice
      ? decrypt(appointment.prescription.advice)
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

    const diagnosis = decrypt(appointment.prescription.diagnosis);
    const medicines = decrypt(appointment.prescription.medicines);
    const advice = appointment.prescription.advice
      ? decrypt(appointment.prescription.advice)
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

/* ================= GENERATE QR CODE FOR PRESCRIPTION ================= */
router.get("/prescription/qr/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctor");

    if (!appointment || !appointment.prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    if (appointment.prescription.isRevoked) {
      return res.status(403).json({
        success: false,
        message: "Prescription revoked by admin"
      });
    }

    // Decrypt prescription data
    const diagnosis = decrypt(appointment.prescription.diagnosis) || "";
    const medicines = decrypt(appointment.prescription.medicines) || "";
    const advice = appointment.prescription.advice
      ? decrypt(appointment.prescription.advice)
      : "";

    // Create formatted prescription text for QR code
    const prescriptionText = `
====================================
    MEDICARE PRESCRIPTION
====================================

PATIENT: ${appointment.patientName}
EMAIL: ${appointment.patientEmail}

DOCTOR: ${appointment.doctor.name}
SPECIALIZATION: ${appointment.doctor.specialization}
DATE: ${appointment.date}

------------------------------------

DIAGNOSIS:
${diagnosis}

PRESCRIBED MEDICINES:
${medicines}

MEDICAL ADVICE:
${advice || "No additional advice provided"}

------------------------------------

Digitally Signed Prescription
Verification: ${appointment.prescription.signature ? "Valid" : "Unverified"}

------------------------------------
`.trim();

    // Generate QR code with prescription text
    const qrCodeDataUrl = await generateQR(prescriptionText);

    res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      prescriptionText: prescriptionText,
      prescriptionData: {
        patient: appointment.patientName,
        doctor: appointment.doctor.name,
        date: appointment.date,
        diagnosis,
        medicines,
        advice
      }
    });

  } catch (err) {
    console.error("QR GENERATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error generating QR code"
    });
  }
});

/* ================= GET SINGLE APPOINTMENT BY ID (PUBLIC) ================= */
router.get("/by-id/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctor");

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (!appointment.prescription) {
      return res.json({ success: false, message: "No prescription for this appointment" });
    }

    if (appointment.prescription.isRevoked) {
      return res.json({ success: false, message: "Prescription has been revoked" });
    }

    // Decrypt prescription fields using safe wrapper
    const diagnosis = safeDecrypt(appointment.prescription.diagnosis);
    const medicines = safeDecrypt(appointment.prescription.medicines);
    const advice = safeDecrypt(appointment.prescription.advice);

    // Verify digital signature
    const isValid = verifySignature(
      `${diagnosis}${medicines}${advice}${appointment._id.toString()}`,
      appointment.prescription.signature
    );

    res.json({
      success: true,
      appointment: {
        _id: appointment._id,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        date: appointment.date,
        doctor: appointment.doctor,
        prescription: {
          diagnosis,
          medicines,
          advice,
          isValid,
          isRevoked: appointment.prescription.isRevoked || false
        }
      }
    });

  } catch (err) {
    console.error("BY-ID ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ================= ADMIN: DEBUG SIGNATURE FOR ONE APPOINTMENT ================= */
router.get("/admin/debug/:id", async (req, res) => {
  try {
    const app = await Appointment.findById(req.params.id);
    if (!app || !app.prescription) {
      return res.json({ success: false, message: "Not found" });
    }

    const diagnosis = safeDecrypt(app.prescription.diagnosis);
    const medicines = safeDecrypt(app.prescription.medicines);
    const advice = safeDecrypt(app.prescription.advice);
    const appId = app._id.toString();
    const verifyStr = `${diagnosis}${medicines}${advice}${appId}`;
    const computed = signData(verifyStr);
    const stored = app.prescription.signature;
    const match = computed === stored;

    res.json({
      appId,
      diagnosisRaw: app.prescription.diagnosis?.substring(0, 30),
      medicinesRaw: app.prescription.medicines?.substring(0, 30),
      adviceRaw: app.prescription.advice?.substring(0, 30),
      diagnosis, medicines, advice,
      verifyStr,
      storedSig: stored?.substring(0, 32),
      computedSig: computed?.substring(0, 32),
      match
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ================= ADMIN: RE-SIGN ALL PRESCRIPTIONS ================= */
// One-time fix route: decrypts and re-signs all existing prescriptions
// using the current signing key. Run once to fix historical mismatches.
router.post("/admin/resign-all", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      prescription: { $exists: true }
    });

    let fixed = 0;
    let skipped = 0;

    for (const app of appointments) {
      if (!app.prescription || app.prescription.isRevoked) {
        skipped++;
        continue;
      }

      // Decrypt current values (may fail for old/corrupted data - use safe wrapper)
      const diagnosis = safeDecrypt(app.prescription.diagnosis);
      const medicines = safeDecrypt(app.prescription.medicines);
      const advice = safeDecrypt(app.prescription.advice);

      if (!diagnosis || !medicines) {
        skipped++;
        continue;
      }

      // Re-sign with current key
      const newSignature = signData(
        `${diagnosis}${medicines}${advice}${app._id.toString()}`
      );

      // Re-encrypt with current static encrypt function
      app.prescription.diagnosis = encrypt(diagnosis);
      app.prescription.medicines = encrypt(medicines);
      app.prescription.advice = advice ? encrypt(advice) : "";
      app.prescription.signature = newSignature;

      await app.save();
      fixed++;
    }

    res.json({
      success: true,
      message: `Re-signed ${fixed} prescriptions. Skipped ${skipped}.`
    });

  } catch (err) {
    console.error("RESIGN-ALL ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

