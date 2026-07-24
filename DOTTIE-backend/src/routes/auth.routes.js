const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const forgotPasswordSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.email) {
      throw new Error('Email is required');
    }
    return body;
  },
};

const resetPasswordSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.token || !body.newPassword) {
      throw new Error('Token and new password are required');
    }
    if (body.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    return body;
  },
};

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireAuth, authController.me);

module.exports = router;
