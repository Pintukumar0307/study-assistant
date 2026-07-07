const StudyProgress = require('../models/StudyProgress');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');

// @desc    Generate study plan
// @route   POST /api/v1/study-planner/generate
// @access  Private
const generateStudyPlan = async (req, res, next) => {
  try {
    const { examDate, subjects, documentIds } = req.body;

    const plan = await aiService.generateStudyPlan(
      { examDate, subjects, documentIds },
      req.user._id.toString()
    );

    // Save to all document progresses
    for (const docId of documentIds || []) {
      await StudyProgress.findOneAndUpdate(
        { userId: req.user._id, documentId: docId },
        {
          $set: {
            'studyPlan.examDate': examDate,
            'studyPlan.subjects': subjects,
            'studyPlan.dailyPlan': plan.dailyPlan,
            'studyPlan.weeklyPlan': plan.weeklyPlan,
          },
        },
        { upsert: true }
      );
    }

    ApiResponse.success(res, { plan }, 'Study plan generated');
  } catch (error) {
    next(error);
  }
};

// @desc    Get study plan
// @route   GET /api/v1/study-planner/:documentId
// @access  Private
const getStudyPlan = async (req, res, next) => {
  try {
    const progress = await StudyProgress.findOne({
      userId: req.user._id,
      documentId: req.params.documentId,
    });

    if (!progress || !progress.studyPlan?.examDate) {
      return next(ApiError.notFound('No study plan found'));
    }

    ApiResponse.success(res, { studyPlan: progress.studyPlan });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark daily task as completed
// @route   PUT /api/v1/study-planner/:documentId/task
// @access  Private
const completeTask = async (req, res, next) => {
  try {
    const { date } = req.body;

    await StudyProgress.updateOne(
      {
        userId: req.user._id,
        documentId: req.params.documentId,
        'studyPlan.dailyPlan.date': new Date(date),
      },
      { $set: { 'studyPlan.dailyPlan.$.completed': true } }
    );

    ApiResponse.success(res, null, 'Task marked complete');
  } catch (error) {
    next(error);
  }
};

module.exports = { generateStudyPlan, getStudyPlan, completeTask };
