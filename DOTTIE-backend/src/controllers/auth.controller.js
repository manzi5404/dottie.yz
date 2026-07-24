const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validate } = require('../middleware/validate');
const authService = require('../services/auth.service');
const { handleServiceError } = require('../utils/responseHandler');
const { events } = require('../events');
const { supabaseAdmin } = require('../config/supabase');

const registerSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.email || !body.password) {
      throw new Error('email and password are required');
    }
    if (body.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    return body;
  },
};

const loginSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.email || !body.password) {
      throw new Error('email and password are required');
    }
    return body;
  },
};

const googleSchema = {
  parse: (input) => {
    const { body } = input;
    if (!body.id_token) {
      throw new Error('id_token is required');
    }
    return body;
  },
};

async function sendAuthResponse(res, tokenData) {
  if (!tokenData || !tokenData.access_token) {
    const error = new Error('Invalid authentication response: missing access_token');
    error.statusCode = 500;
    throw error;
  }
  return res.status(200).json({
    success: true,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    user: tokenData.user,
  });
}

async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    const user = await authService.register(email, password, name);
    return res.status(201).json({ success: true, user });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const tokenData = await authService.login(email, password);
    return sendAuthResponse(res, tokenData);
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function googleAuth(req, res) {
  try {
    const { id_token } = req.body;
    const tokenData = await authService.googleOAuth(id_token);
    return sendAuthResponse(res, tokenData);
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function me(req, res) {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return handleServiceError(res, err, req);
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await authService.getProfileByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://DOTTIE.YZrw.netlify.app';
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/reset-password.html`,
    });

    if (error) {
      console.error('Forgot password error:', error);
      return res.status(400).json({ message: error.message || 'Failed to send reset email' });
    }

    return res.status(200).json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return handleServiceError(res, err, req);
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const { createClient } = require('@supabase/supabase-js');
    const tempSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: verifyData, error: verifyError } = await tempSupabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (verifyError || !verifyData.user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const { error: updateError } = await tempSupabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ message: updateError.message || 'Failed to update password' });
    }

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    return handleServiceError(res, err, req);
  }
}

module.exports = {
  register,
  login,
  googleAuth,
  me,
  forgotPassword,
  resetPassword,
};
