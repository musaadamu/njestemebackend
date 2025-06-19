const Journal = require('../models/Journal');

exports.downloadPdfFile = async (req, res) => {
    console.log('\n\n🔴🔴🔴 DOWNLOAD PDF FILE REQUESTED 🔴🔴🔴');
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

        // Get the Cloudinary URL, preferring the Cloudinary URL if available
        const cloudinaryUrl = journal.pdfCloudinaryUrl || journal.pdfWebViewLink;
        if (!cloudinaryUrl) {
            console.error('No Cloudinary URL found for PDF file');
            return res.status(404).json({ message: 'No PDF file found for this journal' });
        }

        // For PDFs, use Cloudinary's fl_attachment URL format for better download experience
        let downloadUrl = cloudinaryUrl;

        // Add fl_attachment flag to force download if not already present
        if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
            downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
            console.log('Using Cloudinary URL with fl_attachment:', downloadUrl);
        }

        // Sanitize filename for Content-Disposition header
        const sanitizedFilename = journal.title
            ? journal.title
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '_')     // Replace spaces with underscores
                .substring(0, 100)        // Limit length
            : 'journal';

        // Set appropriate headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.pdf"`);

        console.log('Redirecting client to Cloudinary URL:', downloadUrl);
        return res.redirect(downloadUrl);
    } catch (error) {
        console.error('Error downloading PDF file:', error);
        res.status(500).json({
            message: 'Server error during PDF download',
            error: error.message
        });
    }
};

exports.downloadDocxFile = async (req, res) => {
    console.log('\n\n🔴🔴🔴 DOWNLOAD DOCX FILE REQUESTED 🔴🔴🔴');
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

        // Get the Cloudinary URL, preferring the Cloudinary URL if available
        const cloudinaryUrl = journal.docxCloudinaryUrl || journal.docxWebViewLink;
        if (!cloudinaryUrl) {
            console.error('No Cloudinary URL found for DOCX file');
            return res.status(404).json({ message: 'No DOCX file found for this journal' });
        }

        // For DOCX files, use Cloudinary's fl_attachment URL format for better download experience
        let downloadUrl = cloudinaryUrl;

        // Add fl_attachment flag to force download if not already present
        if (cloudinaryUrl.includes('/upload/') && !cloudinaryUrl.includes('fl_attachment')) {
            downloadUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
            console.log('Using Cloudinary URL with fl_attachment:', downloadUrl);
        }

        // Sanitize filename for Content-Disposition header
        const sanitizedFilename = journal.title
            ? journal.title
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '_')     // Replace spaces with underscores
                .substring(0, 100)        // Limit length
            : 'journal';

        // Set appropriate headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.docx"`);

        console.log('Redirecting client to Cloudinary URL:', downloadUrl);
        return res.redirect(downloadUrl);
    } catch (error) {
        console.error('Error downloading DOCX file:', error);
        res.status(500).json({
            message: 'Server error during DOCX download',
            error: error.message
        });
    }
};
