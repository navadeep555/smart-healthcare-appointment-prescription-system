const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No Authorization header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    // ❌ Not in Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format"
      });
    }

    // ✅ Extract token
    const token = authHeader.split(" ")[1];

    // ❌ Token missing after Bearer
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretkey"
    );

    // ✅ Attach user info to request
    req.user = decoded; // { id, role }

    next();

  } catch (err) {
    console.error("VERIFY TOKEN ERROR:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};
