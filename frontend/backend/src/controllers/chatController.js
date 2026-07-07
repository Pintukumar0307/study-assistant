const { v4: uuidv4 } = require('uuid');
const ChatHistory = require('../models/ChatHistory');
const Document = require('../models/Document');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');

// @desc    Send a message (RAG chat)
// @route   POST /api/v1/chat
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { message, documentId, sessionId } = req.body;

    if (documentId) {
      const doc = await Document.findOne({
        _id: documentId,
        userId: req.user._id,
        status: 'ready',
      });
      if (!doc) {
        return next(ApiError.notFound('Document not found or not ready'));
      }
    }

    // Find or create session
    let chatSession = await ChatHistory.findOne({
      userId: req.user._id,
      sessionId: sessionId || uuidv4(),
    });

    const currentSessionId = sessionId || uuidv4();

    if (!chatSession) {
      chatSession = await ChatHistory.create({
        userId: req.user._id,
        documentId: documentId || null,
        sessionId: currentSessionId,
        title: message.substring(0, 50),
        messages: [],
      });
    }

    // Add user message
    chatSession.messages.push({ role: 'user', content: message });

    // Build conversation history for AI (last 10 messages)
    const recentHistory = chatSession.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call AI service
    const aiResponse = await aiService.chat(
      message,
      documentId || null,
      req.user._id.toString(),
      recentHistory
    );

    // Add assistant response
    chatSession.messages.push({
      role: 'assistant',
      content: aiResponse.answer,
      sources: aiResponse.sources || [],
      confidence: aiResponse.confidence || null,
    });

    await chatSession.save();

    ApiResponse.success(res, {
      sessionId: chatSession.sessionId,
      answer: aiResponse.answer,
      sources: aiResponse.sources || [],
      confidence: aiResponse.confidence || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat sessions
// @route   GET /api/v1/chat/sessions
// @access  Private
const getChatSessions = async (req, res, next) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('sessionId title documentId updatedAt')
      .populate('documentId', 'title');

    ApiResponse.success(res, { sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat session messages
// @route   GET /api/v1/chat/sessions/:sessionId
// @access  Private
const getChatSession = async (req, res, next) => {
  try {
    const session = await ChatHistory.findOne({
      userId: req.user._id,
      sessionId: req.params.sessionId,
    }).populate('documentId', 'title');

    if (!session) {
      return next(ApiError.notFound('Chat session not found'));
    }

    ApiResponse.success(res, { session });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat session
// @route   DELETE /api/v1/chat/sessions/:sessionId
// @access  Private
const deleteChatSession = async (req, res, next) => {
  try {
    await ChatHistory.deleteOne({
      userId: req.user._id,
      sessionId: req.params.sessionId,
    });
    ApiResponse.success(res, null, 'Session deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getChatSessions, getChatSession, deleteChatSession };
