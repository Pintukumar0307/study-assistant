const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { sendMessage, getChatSessions, getChatSession, deleteChatSession } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/', [
  body('message').notEmpty().trim().withMessage('Message is required'),
], validate, sendMessage);

router.get('/sessions', getChatSessions);
router.get('/sessions/:sessionId', getChatSession);
router.delete('/sessions/:sessionId', deleteChatSession);

module.exports = router;
