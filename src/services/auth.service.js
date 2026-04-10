const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../config/logger');
const { getRedisClient } = require('../config/redis');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password });
  logger.info('New user registered', { userId: user._id, email });
  return user;
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    logger.warn('Failed login attempt', { email });
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated');
    error.statusCode = 403;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info('User logged in successfully', { userId: user._id, email });
  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (token) => {
  if (!token) {
    const error = new Error('Refresh token required');
    error.statusCode = 401;
    throw error;
  }

  // Check if token is blacklisted in Redis
  try {
    const redis = getRedisClient();
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      const error = new Error('Token has been revoked');
      error.statusCode = 401;
      throw error;
    }
  } catch (redisErr) {
    if (redisErr.statusCode === 401) throw redisErr;
    logger.warn('Redis check failed, proceeding without blacklist check');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  logger.info('Access token refreshed', { userId: user._id });
  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, refreshToken) => {
  // Blacklist the refresh token in Redis
  try {
    const redis = getRedisClient();
    const decoded = jwt.decode(refreshToken);
    const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 604800;
    if (ttl > 0) {
      await redis.setex(`blacklist:${refreshToken}`, ttl, 'true');
    }
  } catch (err) {
    logger.warn('Could not blacklist token in Redis', { error: err.message });
  }

  await User.findByIdAndUpdate(userId, { refreshToken: null });
  logger.info('User logged out', { userId });
};

module.exports = { register, login, refreshAccessToken, logout };
