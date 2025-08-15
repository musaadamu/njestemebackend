// // routes/authRoutes.js
// const express = require('express');
// const { register, login, logout, forgotPassword } = require('../controllers/authController');
// const { isAuthenticated } = require('../middlewares/authMiddleware');
// const router = express.Router();

// router.post('/register', register);
// router.post('/login', login);
// router.post('/logout', isAuthenticated, logout);
// router.post('/forgot-password', forgotPassword);

// module.exports = router;

const express = require('express');
const { register, login, logout, forgotPassword, resetPassword, updateUser, getProfile, createAdmin } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { authRateLimit } = require('../middleware/security');
const {
    validateUserRegistration,
    validateUserLogin,
    validateProfileUpdate,
    validatePasswordReset,
    validatePasswordResetConfirm
} = require('../middleware/validation');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Authentication routes with validation
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/logout', protect, logout);
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.post('/reset-password/:token', validatePasswordResetConfirm, resetPassword);
router.post('/reset-password', validatePasswordResetConfirm, resetPassword);
router.put('/profile', protect, validateProfileUpdate, updateUser);
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.post('/create-admin', protect, adminOnly, validateUserRegistration, createAdmin);

module.exports = router;
