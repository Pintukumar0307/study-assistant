const User = require('../models/User');
const QuizResult = require('../models/QuizResult');
const Document = require('../models/Document');
const StudyProgress = require('../models/StudyProgress');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    ApiResponse.success(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const allowedUpdates = {};

    if (name) allowedUpdates.name = name;
    if (avatar) allowedUpdates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    ApiResponse.success(res, { user }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/v1/users/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isValid = await user.comparePassword(currentPassword);

    if (!isValid) {
      return next(ApiError.badRequest('Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/v1/users/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalDocuments,
      quizResults,
      recentQuizzes,
      studyProgress,
    ] = await Promise.all([
      Document.countDocuments({ userId, status: 'ready' }),
      QuizResult.find({ userId, status: 'completed' }).select('score percentage createdAt'),
      QuizResult.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('documentId', 'title'),
      StudyProgress.find({ userId }).select('timeSpent lastStudied completionPercentage'),
    ]);

    const avgQuizScore =
      quizResults.length > 0
        ? Math.round(quizResults.reduce((acc, r) => acc + r.percentage, 0) / quizResults.length)
        : 0;

    const totalStudyTime = studyProgress.reduce((acc, p) => acc + p.timeSpent, 0);

    const flashcardsReviewed = studyProgress.reduce((acc, p) => {
      return acc; // Placeholder for actual flashcard counts
    }, 0);

    // Build weekly study chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push({
        date: date.toISOString().split('T')[0],
        studyTime: 0,
        quizzesCompleted: 0,
      });
    }

    ApiResponse.success(res, {
      stats: {
        totalDocuments,
        totalQuizzesTaken: quizResults.length,
        avgQuizScore,
        totalStudyTime,
        flashcardsReviewed,
        studyStreak: req.user.studyStreak,
      },
      recentQuizzes,
      weeklyActivity: last7Days,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword, getDashboardStats };
