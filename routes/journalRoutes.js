const express = require("express");
const journalController = require("../controllers/journalController");
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateFileUpload } = require('../middleware/security');
const { validateJournalSubmission, validateObjectId, validateSearchQuery } = require('../middleware/validation');

const router = express.Router();

// Upload journal route (requires admin authentication)
router.post("/", protect, adminOnly, (req, res, next) => {
    console.log('journalRoutes POST / upload route invoked');
    journalController.uploadMiddleware(req, res, (err) => {
        if (err) {
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
        next();
    });
}, validateFileUpload, validateJournalSubmission, journalController.uploadJournal);

// Get all journals
router.get("/", journalController.getJournals);

console.log('journalController.getJournalsFileInfo:', journalController.getJournalsFileInfo);

// Get journals file info (new route for verification)
router.get("/file-info", journalController.getJournalsFileInfo);

// Search journals
router.get("/search", validateSearchQuery, journalController.searchJournals);

// Cloudinary client upload signature (admin only)
router.get('/upload-signature', protect, adminOnly, journalController.getUploadSignature);

// Create journal from Cloudinary metadata (client-side upload flow)
router.post('/from-cloudinary', protect, adminOnly, journalController.createJournalFromCloudinary);

// Get journal by ID
router.get("/:id", validateObjectId, journalController.getJournalById);

// Update journal status (admin only)
router.patch("/:id/status", protect, adminOnly, validateObjectId, journalController.updateJournalStatus);

// Admin endpoint: re-upload missing Cloudinary files for a journal
router.post('/:id/reupload-cloudinary', protect, adminOnly, validateObjectId, journalController.reuploadCloudinary);

// Cloudinary client upload signature (admin only)
router.get('/upload-signature', protect, adminOnly, journalController.getUploadSignature);

// Create journal from Cloudinary metadata (client-side upload flow)
router.post('/from-cloudinary', protect, adminOnly, journalController.createJournalFromCloudinary);

// Delete journal (admin only)
router.delete("/:id", protect, adminOnly, validateObjectId, journalController.deleteJournal);

module.exports = router;
