const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getProfile, updateProfile, changePassword, getDashboardStats } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars'),
], validate, updateProfile);

router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be 8+ chars'),
], validate, changePassword);

router.get('/dashboard', getDashboardStats);

module.exports = router;
