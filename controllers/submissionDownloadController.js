const path = require('path');
const fs = require('fs').promises;
const Submission = require('../models/Submission');
const axios = require('axios');

exports.downloadPdfFile = async (req, res) => {
    console.log('\n\n🔴🔴🔴 SUBMISSION PDF DOWNLOAD REQUESTED 🔴🔴🔴');
    console.log('Request received at:', new Date().toISOString());

    try {
        const submissionId = req.params.id;
        console.log('PDF download requested for submission ID:', submissionId);

        // Find the submission by ID
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            console.error('Submission not found with ID:', submissionId);
            return res.status(404).json({ message: 'Submission not found' });
        }

        console.log('Submission found:', {
            id: submission._id,
            title: submission.title,
            pdfCloudinaryUrl: submission.pdfCloudinaryUrl || 'Not set',
            pdfWebViewLink: submission.pdfWebViewLink || 'Not set'
        });

        // Check if we have a Cloudinary URL
        const cloudinaryUrl = submission.pdfCloudinaryUrl || submission.pdfWebViewLink;
        if (!cloudinaryUrl) {
            console.error('No Cloudinary URL found for PDF file');
            return res.status(404).json({ message: 'No PDF file found for this submission' });
        }

        console.log('Using Cloudinary URL for PDF download:', cloudinaryUrl);

        // Create a download URL with fl_attachment flag if not already present
        let downloadUrl = cloudinaryUrl;
        if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
            downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
            console.log('Modified Cloudinary URL with fl_attachment:', downloadUrl);
        }

        try {
            // Download the file from Cloudinary
            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'arraybuffer',
                timeout: 30000 // 30 second timeout
            });

            // Sanitize the filename
            const sanitizedFilename = submission.title
                ? submission.title
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_')     // Replace spaces with underscores
                    .substring(0, 100)        // Limit length
                : 'submission';

            // Set the appropriate headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.pdf"`);
            res.setHeader('Content-Length', response.data.length);

            // Send the file directly to the client
            return res.send(response.data);
        } catch (downloadError) {
            console.error('Error downloading file from Cloudinary:', downloadError);
            throw new Error('Failed to download file from Cloudinary');
        }
    } catch (error) {
        console.error('Error in downloadPdfFile:', error);
        return res.status(500).json({
            message: 'Server error during PDF download',
            error: error.message
        });
    }
};

exports.downloadDocxFile = async (req, res) => {
    try {
        const submissionId = req.params.id;
        console.log('DOCX download requested for submission ID:', submissionId);

        // Find the submission by ID
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if we have a Cloudinary URL
        if (submission.docxCloudinaryUrl || submission.docxWebViewLink) {
            const cloudinaryUrl = submission.docxCloudinaryUrl || submission.docxWebViewLink;
            console.log('Using Cloudinary URL for DOCX download:', cloudinaryUrl);

            try {
                // Create a download URL with fl_attachment flag if not already present
                let downloadUrl = cloudinaryUrl;
                if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
                    downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
                    console.log('Modified Cloudinary URL with fl_attachment:', downloadUrl);
                }

                // Download the file from Cloudinary
                const response = await axios({
                    method: 'GET',
                    url: downloadUrl,
                    responseType: 'arraybuffer',
                    timeout: 30000 // 30 second timeout
                });

                // Sanitize the filename
                const sanitizedFilename = submission.title
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_')     // Replace spaces with underscores
                    .substring(0, 100);       // Limit length

                const filename = sanitizedFilename || 'submission';

                // Set the appropriate headers
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
                res.setHeader('Content-Length', response.data.length);

                // Send the file data
                res.send(response.data);
                console.log('DOCX file sent to client successfully');
                return;
            } catch (cloudinaryError) {
                console.error('Error downloading DOCX from Cloudinary:', cloudinaryError);
                // Fall back to local file if available
            }
        }

        // Fall back to local file if Cloudinary URL is not available or download failed
        if (submission.docxFilePath) {
            const filePath = path.join(__dirname, '..', submission.docxFilePath.replace(/\\/g, '/'));
            console.log('Falling back to local DOCX file:', filePath);

            try {
                // Check if file exists
                await fs.access(filePath);

                // Extract filename from the path
                const fileName = path.basename(filePath);

                // Set headers for DOCX download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

                // Stream the file
                res.sendFile(filePath, (err) => {
                    if (err) {
                        console.error('Download error:', err);
                        if (!res.headersSent) {
                            res.status(500).json({ message: 'Error downloading file' });
                        }
                    }
                });
                return;
            } catch (localFileError) {
                console.error('Error accessing local DOCX file:', localFileError);
                // Continue to error response
            }
        }

        // If we get here, both Cloudinary and local file approaches failed
        return res.status(404).json({
            message: 'DOCX file not found',
            details: {
                submissionId: req.params.id,
                cloudinaryUrl: submission.docxCloudinaryUrl || 'Not available',
                localPath: submission.docxFilePath || 'Not available'
            }
        });
    } catch (error) {
        console.error('File download error:', error);

        // Log additional error details
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            path: error.path
        });

        res.status(500).json({ message: 'Server error during file download' });
    }
};

exports.readFileContent = async (req, res) => {
    try {
        const submissionId = req.params.id;
        console.log('File content read requested for submission ID:', submissionId);

        // Find the submission by ID
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // Check if we have a Cloudinary URL for PDF
        if (submission.pdfCloudinaryUrl || submission.pdfWebViewLink) {
            const cloudinaryUrl = submission.pdfCloudinaryUrl || submission.pdfWebViewLink;
            console.log('Using Cloudinary URL for PDF content:', cloudinaryUrl);

            // Redirect to the Cloudinary URL for viewing
            return res.redirect(cloudinaryUrl);
        }

        // Fall back to local file if Cloudinary URL is not available
        if (submission.pdfFilePath) {
            const filePath = path.join(__dirname, '..', submission.pdfFilePath.replace(/\\/g, '/'));
            console.log('Falling back to local PDF file for content:', filePath);

            try {
                // Check if file exists
                await fs.access(filePath);

                // Stream the file content
                return res.sendFile(filePath);
            } catch (localFileError) {
                console.error('Error accessing local PDF file:', localFileError);
                // Continue to error response
            }
        }

        // If we get here, both Cloudinary and local file approaches failed
        return res.status(404).json({
            message: 'PDF file not found for reading',
            details: {
                submissionId: req.params.id,
                cloudinaryUrl: submission.pdfCloudinaryUrl || 'Not available',
                localPath: submission.pdfFilePath || 'Not available'
            }
        });
    } catch (error) {
        console.error('File read error:', error);

        // Log additional error details
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            path: error.path
        });

        res.status(500).json({ message: 'Server error reading file' });
    }
};
