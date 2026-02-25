const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
    {
        patientEmail: {
            type: String,
            required: true,
            index: true
        },
        doctorEmail: {
            type: String,
            required: true
        },
        reportName: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        date: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("MedicalReport", medicalReportSchema);
