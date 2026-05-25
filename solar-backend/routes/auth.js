const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ADMIN = {
  email: "admin@admin.com",
  password: "Password@123"
};

router.post('/login', (req, res) => {
  let { email, password } = req.body;

  email = email.trim().toLowerCase();
  password = password.trim();

  if (email === ADMIN.email && password === ADMIN.password) {
    const token = jwt.sign({ role: "admin" }, "secretkey", { expiresIn: "1y" });
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;