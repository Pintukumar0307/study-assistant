const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} = require('../utils/jwtUtils');
const logger = require('../utils/logger');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('Email already registered'));
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });
    await user.save();

    logger.info(`New user registered: ${email}`);

    ApiResponse.created(res, {
      user,
      accessToken,
      refreshToken,
    }, 'Registration successful');
  } catch (error) {
    logger.error(`Error registering user: ${email}`);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    if (!user.isActive) {
      return next(ApiError.unauthorized('Account is deactivated'));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Clean expired refresh tokens and add new one
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.expiresAt > new Date()
    );
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });
    await user.save();

    logger.info(`User logged in: ${email}`);

    ApiResponse.success(res, {
      user,
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(ApiError.badRequest('Refresh token is required'));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return next(ApiError.unauthorized('Invalid or expired refresh token'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(ApiError.unauthorized('User not found'));
    }

    const tokenEntry = user.refreshTokens.find((t) => t.token === token);
    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      return next(ApiError.unauthorized('Refresh token is invalid or expired'));
    }

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: getRefreshTokenExpiry(),
    });
    await user.save();

    ApiResponse.success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Tokens refreshed');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      req.user.refreshTokens = req.user.refreshTokens.filter(
        (t) => t.token !== token
      );
      await req.user.save();
    }

    logger.info(`User logged out: ${req.user.email}`);
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    ApiResponse.success(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };
