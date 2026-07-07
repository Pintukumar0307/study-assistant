const StudyProgress = require('../models/StudyProgress');
const Document = require('../models/Document');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');

// SM-2 spaced repetition algorithm
const sm2 = (card, quality) => {
  // quality: 0-5 (0-2 = fail, 3-5 = pass)
  let { repetitions, easeFactor, interval } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions++;
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return { repetitions, easeFactor, interval, nextReviewDate };
};

// @desc    Generate flashcards for a document
// @route   POST /api/v1/flashcards/generate
// @access  Private
const generateFlashcards = async (req, res, next) => {
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

    const flashcardsData = await aiService.generateFlashcards(
      documentId,
      req.user._id.toString()
    );

    let progress = await StudyProgress.findOne({
      userId: req.user._id,
      documentId,
    });

    if (!progress) {
      progress = await StudyProgress.create({
        userId: req.user._id,
        documentId,
        flashcards: flashcardsData.flashcards,
      });
    } else {
      progress.flashcards = flashcardsData.flashcards;
      await progress.save();
    }

    ApiResponse.created(res, {
      flashcards: progress.flashcards,
      count: progress.flashcards.length,
    }, 'Flashcards generated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get flashcards for a document
// @route   GET /api/v1/flashcards/:documentId
// @access  Private
const getFlashcards = async (req, res, next) => {
  try {
    const progress = await StudyProgress.findOne({
      userId: req.user._id,
      documentId: req.params.documentId,
    });

    if (!progress) {
      return next(ApiError.notFound('No flashcards found for this document'));
    }

    // Get due cards (nextReviewDate <= now)
    const now = new Date();
    const dueCards = progress.flashcards.filter((c) => c.nextReviewDate <= now);
    const allCards = progress.flashcards;

    ApiResponse.success(res, {
      flashcards: allCards,
      dueCount: dueCards.length,
      totalCount: allCards.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review a flashcard (SM-2 update)
// @route   POST /api/v1/flashcards/:documentId/review/:cardId
// @access  Private
const reviewFlashcard = async (req, res, next) => {
  try {
    const { quality } = req.body; // 0-5

    const progress = await StudyProgress.findOne({
      userId: req.user._id,
      documentId: req.params.documentId,
    });

    if (!progress) {
      return next(ApiError.notFound('Flashcard set not found'));
    }

    const card = progress.flashcards.id(req.params.cardId);
    if (!card) {
      return next(ApiError.notFound('Flashcard not found'));
    }

    const updated = sm2(card, quality);
    Object.assign(card, updated);
    card.lastReviewed = new Date();
    card.isLearned = updated.interval >= 21;

    progress.lastStudied = new Date();
    progress.timeSpent += 1;

    await progress.save();

    ApiResponse.success(res, { card, nextReview: card.nextReviewDate });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateFlashcards, getFlashcards, reviewFlashcard };
