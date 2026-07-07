const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { generateFlashcards, getFlashcards, reviewFlashcard } = require('../controllers/flashcardController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/generate', [
  body('documentId').notEmpty().withMessage('Document ID required'),
], validate, generateFlashcards);

router.get('/:documentId', getFlashcards);
router.post('/:documentId/review/:cardId', [
  body('quality').isInt({ min: 0, max: 5 }).withMessage('Quality must be 0-5'),
], validate, reviewFlashcard);

module.exports = router;
