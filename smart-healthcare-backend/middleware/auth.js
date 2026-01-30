module.exports = (req, res, next) => {
  const user = req.headers["x-user"];

  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.user = JSON.parse(user);
  next();
};
