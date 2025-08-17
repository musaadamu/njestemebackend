const { body, param, query, validationResult } = require('express-validator');
const { validateEmail, validatePassword, validateName, validateObjectId: isValidObjectId } = require('./security');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));

        console.log('❌ Validation failed for request:', {
            url: req.url,
            method: req.method,
            body: req.body,
            files: req.files ? Object.keys(req.files) : 'No files',
            errors: errorMessages
        });

        return res.status(400).json({
            error: 'Validation failed',
            details: errorMessages
        });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
        .custom((value) => {
            if (!validateName(value)) {
                throw new Error('Invalid name format');
            }
            return true;
        }),
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
        .isLength({ max: 254 })
        .withMessage('Email is too long')
        .custom((value) => {
            if (!validateEmail(value)) {
                throw new Error('Invalid email format');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
        .custom((value) => {
            if (!validatePassword(value)) {
                throw new Error('Password does not meet security requirements');
            }
            return true;
        }),
    
    body('role')
        .optional()
        .isIn(['author', 'editor', 'admin'])
        .withMessage('Invalid role specified'),
    
    handleValidationErrors
];

// User login validation
const validateUserLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ max: 128 })
        .withMessage('Password is too long'),
    
    handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
        .isLength({ max: 254 })
        .withMessage('Email is too long'),
    
    body('password')
        .optional()
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    handleValidationErrors
];

// Journal submission validation
const validateJournalSubmission = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 300 })
        .withMessage('Title must be between 5 and 300 characters')
        .matches(/^[a-zA-Z0-9\s\-_:.,!?();"'&@#%\/\[\]{}+=*^~`|\\<>]+$/)
        .withMessage('Title contains invalid characters'),
    
    body('abstract')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Abstract must be between 10 and 2000 characters'),
    
    body('authors')
        .custom((value) => {
            try {
                const authors = typeof value === 'string' ? JSON.parse(value) : value;
                if (!Array.isArray(authors) || authors.length === 0) {
                    throw new Error('At least one author is required');
                }
                if (authors.length > 10) {
                    throw new Error('Maximum 10 authors allowed');
                }
                authors.forEach(author => {
                    if (typeof author !== 'string' || author.trim().length < 2 || author.trim().length > 100) {
                        throw new Error('Each author name must be between 2 and 100 characters');
                    }
                    if (!/^[a-zA-Z\s'-.,&]+$/.test(author.trim())) {
                        throw new Error('Author names can only contain letters, spaces, hyphens, apostrophes, periods, commas, and ampersands');
                    }
                });
                return true;
            } catch (error) {
                throw new Error(error.message || 'Invalid authors format');
            }
        }),
    
    body('keywords')
        .custom((value) => {
            try {
                const keywords = typeof value === 'string' ? JSON.parse(value) : value;
                if (!Array.isArray(keywords) || keywords.length === 0) {
                    throw new Error('At least one keyword is required');
                }
                if (keywords.length > 20) {
                    throw new Error('Maximum 20 keywords allowed');
                }
                keywords.forEach(keyword => {
                    if (typeof keyword !== 'string' || keyword.trim().length < 2 || keyword.trim().length > 50) {
                        throw new Error('Each keyword must be between 2 and 50 characters');
                    }
                    if (!/^[a-zA-Z0-9\s\-_.,()&'":;]+$/.test(keyword.trim())) {
                        throw new Error('Keywords can only contain letters, numbers, spaces, hyphens, underscores, periods, commas, parentheses, ampersands, quotes, colons, and semicolons');
                    }
                });
                return true;
            } catch (error) {
                throw new Error(error.message || 'Invalid keywords format');
            }
        }),
    
    handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = [
    param('id')
        .custom((value) => {
            if (!isValidObjectId(value)) {
                throw new Error('Invalid ID format');
            }
            return true;
        }),

    handleValidationErrors
];

// Search query validation
const validateSearchQuery = [
    query('query')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
        .withMessage('Search query contains invalid characters'),
    
    query('field')
        .optional()
        .isIn(['title', 'abstract', 'keywords', 'authors'])
        .withMessage('Invalid search field'),
    
    handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    handleValidationErrors
];

const validatePasswordResetConfirm = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required')
        .isLength({ min: 32, max: 128 })
        .withMessage('Invalid token format'),
    
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateProfileUpdate,
    validateJournalSubmission,
    validateObjectId,
    validateSearchQuery,
    validatePasswordReset,
    validatePasswordResetConfirm,
    handleValidationErrors
};
