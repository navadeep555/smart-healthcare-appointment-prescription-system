const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },

  patientEmail: {
    type: String,
    required: true
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },

  doctorEmail: {
    type: String
  },

  date: {
    type: String,
    required: true
  },

  time: {
    type: String,
    required: true
  },

  disease: String,

  status: {
    type: String,
    enum: ["Booked", "Cancelled", "Completed"],
    default: "Booked"
  },

  prescription: {
    diagnosis: String,
    medicines: String,
    advice: String,
    signature: String,     // 🔐 digital signature
    signedBy: String,      // doctor name/email
    createdAt: Date,

    /* ================= ADMIN CONTROL (ADDED) ================= */
    isRevoked: {
      type: Boolean,
      default: false
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    revokedAt: {
      type: Date
    }
  }

}, { timestamps: true });

module.exports =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
