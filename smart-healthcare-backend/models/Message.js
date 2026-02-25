const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        senderEmail: {
            type: String,
            required: true,
            index: true
        },
        receiverEmail: {
            type: String,
            required: true,
            index: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
