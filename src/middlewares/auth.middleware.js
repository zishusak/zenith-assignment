const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendError } = require('../utils/response');
const logger = require('../config/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 401, 'User no longer exists.');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Account is deactivated.');
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn('Auth middleware: invalid token', { error: err.message });
    return sendError(res, 401, 'Invalid or expired token.');
  }
};

module.exports = { protect };
