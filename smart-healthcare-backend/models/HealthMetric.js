const mongoose = require("mongoose");

const healthMetricSchema = new mongoose.Schema(
    {
        patientEmail: {
            type: String,
            required: true,
            index: true
        },
        weight: {
            type: Number,
            default: 0
        },
        bloodPressure: {
            type: String,
            default: ""
        },
        bloodGroup: {
            type: String,
            default: ""
        },
        bloodSugar: {
            type: Number,
            default: 0
        },
        heartRate: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("HealthMetric", healthMetricSchema);
