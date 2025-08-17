const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const validator = require('validator');

// Rate limiting removed - no longer using rate limiting middleware

// Security headers configuration
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for file uploads
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize all string inputs
    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove HTML tags and dangerous characters
                obj[key] = xss(obj[key], {
                    whiteList: {}, // No HTML tags allowed
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ['script']
                });
                
                // Trim whitespace
                obj[key] = obj[key].trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// Input validation helpers
const validateEmail = (email) => {
    return validator.isEmail(email) && email.length <= 254;
};

const validatePassword = (password) => {
    return password && 
           password.length >= 6 && 
           password.length <= 128 &&
           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password); // At least one lowercase, uppercase, and digit
};

const validateName = (name) => {
    return name && 
           name.length >= 2 && 
           name.length <= 50 &&
           /^[a-zA-Z\s'-]+$/.test(name); // Only letters, spaces, hyphens, and apostrophes
};

const validateObjectId = (id) => {
    return validator.isMongoId(id);
};

// File upload security
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const file = req.file;
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/pdf'
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    // Check file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
            error: 'Invalid file type. Only DOCX, DOC, and PDF files are allowed.'
        });
    }

    // Check file size
    if (file.size > maxFileSize) {
        return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.'
        });
    }

    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.jar'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(fileExtension)) {
        return res.status(400).json({
            error: 'File type not allowed for security reasons.'
        });
    }

    next();
};

// Error handling middleware that doesn't expose sensitive information
const secureErrorHandler = (err, req, res, next) => {
    console.error('Security Error:', {
        error: err.message,
        stack: err.stack,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
};

// Security logging middleware
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            ip: req.ip,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        };

        // Log suspicious activities
        if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
            console.warn('Security Event:', logData);
        }
    });

    next();
};

module.exports = {
    securityHeaders,
    sanitizeInput,
    mongoSanitize: mongoSanitize(),
    hpp: hpp(),
    validateEmail,
    validatePassword,
    validateName,
    validateObjectId,
    validateFileUpload,
    secureErrorHandler,
    securityLogger
};
