const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/response');
const { getIO } = require('../socket/socket');
const logger = require('../config/logger');

const emitNotification = (type, message) => {
  const io = getIO();
  if (io) {
    io.emit('notification', { type, message, timestamp: new Date().toISOString() });
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await userService.getAllUsers({ page, limit, search });
    sendSuccess(res, 200, 'Users fetched', result);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, 200, 'User fetched', { user });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    emitNotification('USER_CREATED', `New user created: ${user.email}`);
    logger.info('USER_CRUD: create', { adminId: req.user.id, newUserId: user._id });
    sendSuccess(res, 201, 'User created', { user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    emitNotification('USER_UPDATED', `User updated: ${user.email}`);
    logger.info('USER_CRUD: update', { adminId: req.user.id, updatedUserId: user._id });
    sendSuccess(res, 200, 'User updated', { user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    emitNotification('USER_DELETED', `User deleted: ${user.email}`);
    logger.info('USER_CRUD: delete', { adminId: req.user.id, deletedUserId: user._id });
    sendSuccess(res, 200, 'User deleted');
  } catch (err) {
    next(err);
  }
};

const updateOwnProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user.id, req.body);
    sendSuccess(res, 200, 'Profile updated', { user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, updateOwnProfile };
