const { verifyAccessToken } = require('../utils/jwtUtils');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Access token is required'));
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Access token expired'));
      }
      return next(ApiError.unauthorized('Invalid access token'));
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('User not found or inactive'));
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(ApiError.internal());
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
