const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT secret is not configured on the server' });
      }

      const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({ token, admin: { id: admin._id, email: admin.email } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/auth/verify
router.get('/verify', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    res.json({ admin });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


