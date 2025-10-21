#!/usr/bin/env node
/**
 * One-off script to re-upload a journal's local PDF/DOCX files to Cloudinary
 * Usage: node scripts/reuploadJournal.js <journalId>
 * Ensure environment variables are set (MONGODB_URI, CLOUDINARY_URL or CLOUDINARY_* vars)
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const Journal = require('../models/Journal');

async function main() {
  try {
    const journalId = process.argv[2];
    if (!journalId) {
      console.error('Usage: node scripts/reuploadJournal.js <journalId>');
      process.exit(1);
    }

    // Configure Cloudinary from env (CLOUDINARY_URL or individual vars)
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is required in environment to run this script');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const journal = await Journal.findById(journalId);
    if (!journal) {
      console.error('Journal not found:', journalId);
      process.exit(1);
    }

    const DOCUMENT_STORAGE_PATH = process.env.DOCUMENT_STORAGE_PATH
      ? (process.env.DOCUMENT_STORAGE_PATH.startsWith('../')
          ? path.resolve(path.join(__dirname, '..', process.env.DOCUMENT_STORAGE_PATH))
          : path.resolve(process.env.DOCUMENT_STORAGE_PATH))
      : path.resolve(path.join(__dirname, '..', 'uploads', 'journals'));

    const resolveLocalPath = (relativePath) => {
      if (!relativePath) return null;
      if (path.isAbsolute(relativePath) && fs.existsSync(relativePath)) return relativePath;
      const filename = path.basename(relativePath);
      const candidates = [
        path.resolve(path.join(DOCUMENT_STORAGE_PATH, filename)),
        path.resolve(path.join(__dirname, '..', 'uploads', 'journals', filename)),
        path.resolve(path.join(__dirname, 'uploads', 'journals', filename)),
        path.resolve(path.join(__dirname, '..', '..', 'uploads', 'journals', filename))
      ];
      for (const p of candidates) {
        try { if (fs.existsSync(p)) return p; } catch (e) { /* ignore */ }
      }
      return null;
    };

    const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'Upload';

    let modified = false;

    if (!journal.pdfCloudinaryUrl && journal.pdfFilePath) {
      const localPdf = resolveLocalPath(journal.pdfFilePath);
      if (localPdf) {
        console.log('Uploading PDF from', localPdf);
        const res = await cloudinary.uploader.upload(localPdf, {
          folder: uploadFolder,
          resource_type: 'raw',
          public_id: `${Date.now()}-${path.basename(localPdf)}`,
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });
        console.log('PDF uploaded:', res.secure_url);
        journal.pdfFileId = res.public_id;
        journal.pdfWebViewLink = res.secure_url;
        journal.pdfCloudinaryUrl = res.secure_url;
        modified = true;
      } else {
        console.warn('Local PDF not found for', journal.pdfFilePath);
      }
    }

    if (!journal.docxCloudinaryUrl && journal.docxFilePath) {
      const localDocx = resolveLocalPath(journal.docxFilePath);
      if (localDocx) {
        console.log('Uploading DOCX from', localDocx);
        const res = await cloudinary.uploader.upload(localDocx, {
          folder: uploadFolder,
          resource_type: 'raw',
          public_id: `${Date.now()}-${path.basename(localDocx)}`,
          use_filename: true,
          unique_filename: false,
          overwrite: true
        });
        console.log('DOCX uploaded:', res.secure_url);
        journal.docxFileId = res.public_id;
        journal.docxWebViewLink = res.secure_url;
        journal.docxCloudinaryUrl = res.secure_url;
        modified = true;
      } else {
        console.warn('Local DOCX not found for', journal.docxFilePath);
      }
    }

    if (modified) {
      await journal.save();
      console.log('Journal updated and saved.');
    } else {
      console.log('No uploads performed (either cloud URLs already present or local files missing).');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Script error:', err.message || err);
    process.exit(2);
  }
}

main();
