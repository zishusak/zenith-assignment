const { sendError } = require('../utils/response');
const logger = require('../config/logger');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.originalUrl,
      });
      return sendError(res, 403, `Role '${req.user.role}' is not authorized to access this route.`);
    }
    next();
  };
};

module.exports = { authorize };
