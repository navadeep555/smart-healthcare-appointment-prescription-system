const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  experience: Number,
  hospital: String,
  availableDays: [String],
  availableSlots: [String]
});

module.exports = mongoose.model("Doctor", doctorSchema);
