const express = require("express");
const HealthMetric = require("../models/HealthMetric");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

/* ================= GET HEALTH METRICS ================= */
router.get("/my/:email", verifyToken, async (req, res) => {
    try {
        const metrics = await HealthMetric.findOne({ patientEmail: req.params.email });
        res.json({ success: true, metrics: metrics || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/* ================= UPDATE HEALTH METRICS ================= */
router.post("/update", verifyToken, async (req, res) => {
    try {
        const { email, weight, bloodPressure, bloodGroup, bloodSugar, heartRate } = req.body;

        let metrics = await HealthMetric.findOne({ patientEmail: email });

        if (!metrics) {
            metrics = new HealthMetric({ patientEmail: email });
        }

        if (weight) metrics.weight = weight;
        if (bloodPressure) metrics.bloodPressure = bloodPressure;
        if (bloodGroup) metrics.bloodGroup = bloodGroup;
        if (bloodSugar) metrics.bloodSugar = bloodSugar;
        if (heartRate) metrics.heartRate = heartRate;
        metrics.lastUpdated = Date.now();

        await metrics.save();

        res.json({
            success: true,
            message: "Health metrics updated successfully",
            metrics
        });
    } catch (err) {
        console.error("METRIC UPDATE ERROR:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
