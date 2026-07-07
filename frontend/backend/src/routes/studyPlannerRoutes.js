const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { generateStudyPlan, getStudyPlan, completeTask } = require('../controllers/studyPlannerController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.post('/generate', [
  body('examDate').isISO8601().withMessage('Valid exam date required'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject required'),
], validate, generateStudyPlan);

router.get('/:documentId', getStudyPlan);
router.put('/:documentId/task', completeTask);

module.exports = router;
