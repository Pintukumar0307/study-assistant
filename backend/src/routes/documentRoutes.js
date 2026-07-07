const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  summarizeDocument,
} = require('../controllers/documentController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getDocuments);
router.post('/upload', upload.single('pdf'), uploadDocument);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);
router.post('/:id/summarize', summarizeDocument);

module.exports = router;
