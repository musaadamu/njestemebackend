const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadRateLimit, validateFileUpload } = require('../middleware/security');
const { validateJournalSubmission, validateObjectId, validateSearchQuery } = require('../middleware/validation');

// Upload submission with file (rate limited)
router.post("/", uploadRateLimit, (req, res, next) => {
    submissionController.uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('Multer error in route handler:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    message: 'File too large. Max size is 10MB'
                });
            } else if (err.message.includes('Only .docx files are allowed')) {
                return res.status(400).json({
                    message: 'Invalid file type. Only .docx files are allowed'
                });
            }
            return res.status(500).json({
                message: 'File upload failed',
                error: 'Upload failed'
            });
        }
        console.log('File upload successful in route handler:', req.file);
        next();
    });
}, validateFileUpload, validateJournalSubmission, submissionController.uploadSubmission);

// Test endpoint for file uploads
router.post("/test-upload", (req, res, next) => {
    submissionController.uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('Multer error in test endpoint:', err);
            return res.status(500).json({
                message: 'File upload failed',
                error: err.message
            });
        }
        console.log('Test upload endpoint called');
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded',
                receivedFields: Object.keys(req.body || {})
            });
        }

        res.status(200).json({
            message: 'File upload test successful',
            file: req.file,
            body: req.body
        });
    });
});

// Get all submissions with pagination and filtering (admin only)
router.get('/', protect, adminOnly, submissionController.getSubmissions);

// Search submissions (admin only)
router.get('/search', protect, adminOnly, validateSearchQuery, submissionController.searchSubmissions);

// Get a single submission by ID (admin only)
router.get('/:id', protect, adminOnly, validateObjectId, submissionController.getSubmissionById);

// Update submission status (admin only)
router.patch('/:id/status', protect, adminOnly, validateObjectId, submissionController.updateSubmissionStatus);

// Delete a submission (admin only)
router.delete('/:id', protect, adminOnly, validateObjectId, submissionController.deleteSubmission);

module.exports = router;
