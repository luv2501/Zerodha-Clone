const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verify,
  logout,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify", authMiddleware, verify);
router.post("/logout", logout);

module.exports = router;

