const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');
const { getIO } = require('../socket/socket');
const logger = require('../config/logger');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    sendSuccess(res, 201, 'User registered successfully', { user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Emit WebSocket notification on successful login
    const io = getIO();
    if (io) {
      io.emit('notification', {
        type: 'USER_LOGIN',
        message: `User ${user.email} logged in`,
        timestamp: new Date().toISOString(),
      });
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, 200, 'Login successful', { user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    const tokens = await authService.refreshAccessToken(token);
    sendSuccess(res, 200, 'Token refreshed', tokens);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    await authService.logout(req.user.id, token);
    res.clearCookie('refreshToken');
    sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'Profile fetched', { user: req.user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getProfile };
