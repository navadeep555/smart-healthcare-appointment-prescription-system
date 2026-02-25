const express = require("express");
const MedicalReport = require("../models/MedicalReport");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

/* ================= UPLOAD REPORT ================= */
router.post("/upload", verifyToken, async (req, res) => {
    try {
        const { patientEmail, reportName, description, date, fileUrl } = req.body;
        const newReport = new MedicalReport({
            patientEmail,
            doctorEmail: req.user.email,
            reportName,
            description,
            date,
            fileUrl
        });
        await newReport.save();
        res.json({ success: true, message: "Report uploaded successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/* ================= GET PATIENT REPORTS ================= */
router.get("/patient/:email", verifyToken, async (req, res) => {
    try {
        const reports = await MedicalReport.find({ patientEmail: req.params.email }).sort({ createdAt: -1 });
        res.json({ success: true, reports });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
