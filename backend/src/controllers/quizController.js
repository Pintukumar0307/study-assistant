const QuizResult = require('../models/QuizResult');
const Document = require('../models/Document');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');

// @desc    Generate quiz for a document
// @route   POST /api/v1/quiz/generate
// @access  Private
const generateQuiz = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready',
    });

    if (!document) {
      return next(ApiError.notFound('Document not found or not ready'));
    }

    const quizData = await aiService.generateQuiz(
      documentId,
      req.user._id.toString()
    );

    const quizResult = await QuizResult.create({
      userId: req.user._id,
      documentId,
      title: `Quiz: ${document.title}`,
      questions: quizData.questions,
      totalPoints: quizData.questions.length,
      status: 'generated',
    });

    ApiResponse.created(res, { quiz: quizResult }, 'Quiz generated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers
// @route   POST /api/v1/quiz/:id/submit
// @access  Private
const submitQuiz = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body; // answers: [{ questionIndex, answer }]

    const quiz = await QuizResult.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return next(ApiError.notFound('Quiz not found'));
    }

    if (quiz.status === 'completed') {
      return next(ApiError.badRequest('Quiz already completed'));
    }

    let score = 0;
    const updatedQuestions = quiz.questions.map((q, idx) => {
      const userAnswer = answers.find((a) => a.questionIndex === idx);
      if (userAnswer) {
        const isCorrect =
          userAnswer.answer.trim().toLowerCase() ===
          q.correctAnswer.trim().toLowerCase();
        if (isCorrect) score++;
        return { ...q.toObject(), userAnswer: userAnswer.answer, isCorrect };
      }
      return q.toObject();
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);

    quiz.questions = updatedQuestions;
    quiz.score = score;
    quiz.percentage = percentage;
    quiz.timeTaken = timeTaken || 0;
    quiz.completedAt = new Date();
    quiz.status = 'completed';
    await quiz.save();

    ApiResponse.success(res, {
      quiz,
      result: { score, total: quiz.questions.length, percentage },
    }, 'Quiz submitted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user quiz history
// @route   GET /api/v1/quiz
// @access  Private
const getQuizHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await QuizResult.countDocuments({ userId: req.user._id });

    const quizzes = await QuizResult.find({ userId: req.user._id })
      .populate('documentId', 'title subject')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-questions');

    ApiResponse.success(res, {
      quizzes,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz by ID
// @route   GET /api/v1/quiz/:id
// @access  Private
const getQuiz = async (req, res, next) => {
  try {
    const quiz = await QuizResult.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documentId', 'title');

    if (!quiz) {
      return next(ApiError.notFound('Quiz not found'));
    }

    ApiResponse.success(res, { quiz });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateQuiz, submitQuiz, getQuizHistory, getQuiz };
