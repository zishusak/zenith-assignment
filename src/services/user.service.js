const User = require('../models/user.model');
const logger = require('../config/logger');

const getAllUsers = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }
  const user = await User.create(data);
  logger.info('User created by admin', { userId: user._id, email: user.email });
  return user;
};

const updateUser = async (id, data) => {
  // Prevent password update through this route
  delete data.password;
  delete data.refreshToken;

  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  logger.info('User updated', { userId: id });
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  logger.info('User deleted', { userId: id });
  return user;
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
