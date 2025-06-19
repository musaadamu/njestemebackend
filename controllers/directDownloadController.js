const axios = require('axios');
const Journal = require('../models/Journal');

/**
 * Direct download controller for PDF files
 * This controller bypasses Cloudinary's access control by downloading the file
 * on the server and then streaming it directly to the client
 */
exports.directDownloadPdf = async (req, res) => {
    console.log('\n\n🔴🔴🔴 DIRECT DOWNLOAD PDF FILE REQUESTED 🔴🔴🔴');
    console.log('Request received at:', new Date().toISOString());

    try {
        const journalId = req.params.id;
        console.log('Journal ID:', journalId);

        // Find the journal
        const journal = await Journal.findById(journalId);
        if (!journal) {
            console.error('Journal not found with ID:', journalId);
            return res.status(404).json({ message: 'Journal not found' });
        }

        console.log('Journal found:', {
            id: journal._id,
            title: journal.title,
            pdfFileId: journal.pdfFileId || 'Not set',
            pdfWebViewLink: journal.pdfWebViewLink || 'Not set',
            pdfCloudinaryUrl: journal.pdfCloudinaryUrl || 'Not set'
        });

        // Get the Cloudinary URL
        const cloudinaryUrl = journal.pdfCloudinaryUrl || journal.pdfWebViewLink;
        if (!cloudinaryUrl) {
            console.error('No Cloudinary URL found for PDF file');
            return res.status(404).json({ message: 'No PDF file found for this journal' });
        }

        console.log('Downloading PDF from Cloudinary URL:', cloudinaryUrl);

        // Use the fl_attachment URL format for better download experience
        let downloadUrl = cloudinaryUrl;
        if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
            downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
            console.log('Using Cloudinary URL with fl_attachment:', downloadUrl);
        }

        try {
            // Download the file from Cloudinary
            const response = await axios({
                method: 'GET',
                url: encodeURI(downloadUrl),
                responseType: 'arraybuffer',
                timeout: 30000 // 30 second timeout
            });

            // Sanitize the filename
            const sanitizedFilename = journal.title
                ? journal.title
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_')     // Replace spaces with underscores
                    .substring(0, 100)        // Limit length
                : 'journal';

            // Set appropriate headers for file download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.pdf"`);
            res.setHeader('Content-Length', response.data.length);

            // Stream the file directly to the client
            return res.send(response.data);
        } catch (downloadError) {
            console.error('Error downloading file from Cloudinary:', downloadError);
            throw new Error('Failed to download file from Cloudinary');
        }
    } catch (error) {
        console.error('Error in directDownloadPdf:', error);
        return res.status(500).json({
            message: 'Server error during PDF download',
            error: error.message
        });
    }
};

/**
 * Direct download controller for DOCX files
 * This controller bypasses Cloudinary's access control by downloading the file
 * on the server and then streaming it directly to the client
 */
exports.directDownloadDocx = async (req, res) => {
    console.log('\n\n🔴🔴🔴 DIRECT DOWNLOAD DOCX FILE REQUESTED 🔴🔴🔴');
    console.log('Request received at:', new Date().toISOString());

    try {
        const journalId = req.params.id;
        console.log('Journal ID:', journalId);

        // Find the journal
        const journal = await Journal.findById(journalId);
        if (!journal) {
            console.error('Journal not found with ID:', journalId);
            return res.status(404).json({ message: 'Journal not found' });
        }

        console.log('Journal found:', {
            id: journal._id,
            title: journal.title,
            docxFileId: journal.docxFileId || 'Not set',
            docxWebViewLink: journal.docxWebViewLink || 'Not set',
            docxCloudinaryUrl: journal.docxCloudinaryUrl || 'Not set'
        });

        // Get the Cloudinary URL
        const cloudinaryUrl = journal.docxCloudinaryUrl || journal.docxWebViewLink;
        if (!cloudinaryUrl) {
            console.error('No Cloudinary URL found for DOCX file');
            return res.status(404).json({ message: 'No DOCX file found for this journal' });
        }

        console.log('Downloading DOCX from Cloudinary URL:', cloudinaryUrl);

        // Use the fl_attachment URL format for better download experience
        let downloadUrl = cloudinaryUrl;
        if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
            downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
            console.log('Using Cloudinary URL with fl_attachment:', downloadUrl);
        }

        try {
            // Download the file from Cloudinary
            const response = await axios({
                method: 'GET',
                url: encodeURI(downloadUrl),
                responseType: 'arraybuffer',
                timeout: 30000 // 30 second timeout
            });

            // Sanitize the filename
            const sanitizedFilename = journal.title
                ? journal.title
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '_')     // Replace spaces with underscores
                    .substring(0, 100)        // Limit length
                : 'journal';

            // Set appropriate headers for file download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.docx"`);
            res.setHeader('Content-Length', response.data.length);

            // Stream the file directly to the client
            return res.send(response.data);
        } catch (downloadError) {
            console.error('Error downloading file from Cloudinary:', downloadError);
            throw new Error('Failed to download file from Cloudinary');
        }
    } catch (error) {
        console.error('Error in directDownloadDocx:', error);
        return res.status(500).json({
            message: 'Server error during DOCX download',
            error: error.message
        });
    }
};
