#!/usr/bin/env node
/**
 * Get a single Cloudinary resource by public_id.
 * Usage: node scripts/getCloudinaryResource.js <public_id>
 * Example: node scripts/getCloudinaryResource.js "Upload/1760694685046-1760694684087-BE2"
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const publicId = process.argv[2];

if (!publicId) {
  console.error('Usage: node scripts/getCloudinaryResource.js <public_id>');
  process.exit(1);
}

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

(async () => {
  try {
    console.log('Querying Cloudinary for public_id:', publicId);
    // Try as raw resource first
    try {
      const res = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
      console.log('Found (raw):', JSON.stringify(res, null, 2));
      process.exit(0);
    } catch (errRaw) {
      // Try as upload (image/auto)
      try {
        const res2 = await cloudinary.api.resource(publicId, { resource_type: 'upload' });
        console.log('Found (upload):', JSON.stringify(res2, null, 2));
        process.exit(0);
      } catch (errUpload) {
        console.error('Not found as raw or upload. Raw error:', errRaw.message || errRaw);
        console.error('Upload error:', errUpload.message || errUpload);
        process.exit(2);
      }
    }
  } catch (err) {
    console.error('Cloudinary API error:', err.message || err);
    process.exit(3);
  }
})();
