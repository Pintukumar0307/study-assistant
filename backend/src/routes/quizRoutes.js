const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { generateQuiz, submitQuiz, getQuizHistory, getQuiz } = require('../controllers/quizController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', getQuizHistory);
router.post('/generate', [
  body('documentId').notEmpty().withMessage('Document ID required'),
], validate, generateQuiz);
router.get('/:id', getQuiz);
router.post('/:id/submit', [
  body('answers').isArray().withMessage('Answers array required'),
], validate, submitQuiz);

module.exports = router;
