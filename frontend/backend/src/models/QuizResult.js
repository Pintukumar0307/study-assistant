const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer'],
      required: true,
    },
    options: [String],
    correctAnswer: { type: String, required: true },
    userAnswer: { type: String, default: null },
    isCorrect: { type: Boolean, default: null },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1 },
  },
  { _id: false }
);

const quizResultSchema = new mongoose.Schema(
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
    title: {
      type: String,
      default: 'Untitled Quiz',
    },
    questions: [questionSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number,
      default: 0, // seconds
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['generated', 'in_progress', 'completed'],
      default: 'generated',
    },
  },
  {
    timestamps: true,
  }
);

quizResultSchema.index({ userId: 1, createdAt: -1 });
quizResultSchema.index({ userId: 1, documentId: 1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
