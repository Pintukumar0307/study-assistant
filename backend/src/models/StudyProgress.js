const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    nextReviewDate: { type: Date, default: Date.now },
    repetitions: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 }, // SM-2 algorithm
    interval: { type: Number, default: 1 }, // days
    lastReviewed: { type: Date, default: null },
    isLearned: { type: Boolean, default: false },
  },
  { _id: true }
);

const studyProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    flashcards: [flashcardSchema],
    studyPlan: {
      examDate: Date,
      subjects: [String],
      dailyPlan: [
        {
          date: Date,
          tasks: [String],
          completed: { type: Boolean, default: false },
        },
      ],
      weeklyPlan: [
        {
          week: Number,
          goals: [String],
          topics: [String],
        },
      ],
    },
    timeSpent: {
      type: Number,
      default: 0, // minutes
    },
    lastStudied: {
      type: Date,
      default: null,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

studyProgressSchema.index({ userId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('StudyProgress', studyProgressSchema);
