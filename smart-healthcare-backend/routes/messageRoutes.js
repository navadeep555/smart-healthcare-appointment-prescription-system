const express = require("express");
const Message = require("../models/Message");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

/* ================= SEND MESSAGE ================= */
router.post("/send", verifyToken, async (req, res) => {
    try {
        const { receiverEmail, content } = req.body;
        const newMessage = new Message({
            senderEmail: req.user.email,
            receiverEmail,
            content
        });
        await newMessage.save();
        res.json({ success: true, message: "Message sent" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/* ================= GET MY MESSAGES ================= */
router.get("/my/:email", verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        const messages = await Message.find({
            $or: [{ senderEmail: email }, { receiverEmail: email }]
        }).sort({ timestamp: 1 });
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
