const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { validateRegistration, validateLogin } = require('../middlewares/validate.middleware');

// Register new user
router.post('/register', validateRegistration, async (req, res, next) => {
  try {
    console.log('Registration request received:', JSON.stringify(req.body, null, 2));
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// Login user
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Verify token
router.get('/verify', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const result = await authService.verifyToken(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
