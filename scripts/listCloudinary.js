#!/usr/bin/env node
/**
 * List Cloudinary resources under a folder/prefix.
 * Usage: node scripts/listCloudinary.js [prefix]
 * It reads CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / API vars from env.
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const prefix = process.argv[2] || 'Upload/';

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
    console.log('Listing Cloudinary resources for prefix:', prefix);
    const res = await cloudinary.api.resources({ resource_type: 'raw', prefix, max_results: 100 });
    console.log('total_count:', res.total_count || (res.resources && res.resources.length) || 0);
    if (res.resources && res.resources.length) {
      res.resources.forEach(r => {
        console.log('-', r.public_id, r.secure_url);
      });
    } else {
      console.log('No resources found under prefix:', prefix);
    }
  } catch (err) {
    console.error('Cloudinary API error:', err.message || err);
    process.exit(1);
  }
})();
