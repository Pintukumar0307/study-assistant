const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

// @desc    Upload PDF document
// @route   POST /api/v1/documents/upload
// @access  Private
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(ApiError.badRequest('PDF file is required'));
    }

    const { title, subject, tags } = req.body;

    const document = await Document.create({
      userId: req.user._id,
      title: title || req.file.originalname.replace('.pdf', ''),
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      subject: subject || '',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      status: 'processing',
    });

    // Async: send to AI service for ingestion
    aiService.ingestDocument(document._id.toString(), req.file.path, req.user._id.toString())
      .then(async (result) => {
        document.status = 'ready';
        document.pageCount = result.pageCount || 0;
        document.vectorStoreId = result.collectionId || null;
        await document.save();
        logger.info(`Document ${document._id} ingested successfully`);
      })
      .catch(async (err) => {
        document.status = 'error';
        document.processingError = err.message;
        await document.save();
        logger.error(`Document ${document._id} ingestion failed: ${err.message}`);
      });

    ApiResponse.created(res, { document }, 'Document uploaded. Processing started.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user documents
// @route   GET /api/v1/documents
// @access  Private
const getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, subject } = req.query;
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-filePath');

    ApiResponse.success(res, {
      documents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single document
// @route   GET /api/v1/documents/:id
// @access  Private
const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('-filePath');

    if (!document) {
      return next(ApiError.notFound('Document not found'));
    }

    ApiResponse.success(res, { document });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/v1/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return next(ApiError.notFound('Document not found'));
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from ChromaDB via AI service
    try {
      await aiService.deleteDocument(document._id.toString(), req.user._id.toString());
    } catch (err) {
      logger.warn(`Failed to delete document from vector store: ${err.message}`);
    }

    await document.deleteOne();

    ApiResponse.success(res, null, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get document summary
// @route   POST /api/v1/documents/:id/summarize
// @access  Private
const summarizeDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'ready',
    });

    if (!document) {
      return next(ApiError.notFound('Document not found or not ready'));
    }

    if (document.summary.short) {
      return ApiResponse.success(res, { summary: document.summary });
    }

    const summary = await aiService.summarizeDocument(
      document._id.toString(),
      req.user._id.toString()
    );

    document.summary = summary;
    await document.save();

    ApiResponse.success(res, { summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  summarizeDocument,
};
