const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Explicitly load .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('MONGODB_URI from process.env:', process.env.MONGODB_URI || 'Not set');

// Import the Journal model
const Journal = require('./models/Journal');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log(`Attempting to connect to MongoDB at: ${mongoUri}`);
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Generate sitemap
const generateSitemap = async () => {
  let connection;
  try {
    connection = await connectDB();
    
    // Fetch all published journals
    console.log('Fetching journals from database...');
    const journals = await Journal.find({ status: 'published' }, '_id title publishedDate');
    console.log(`Found ${journals.length} published journals`);
    
    // Base URLs
    let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://njostemejournal.com.ng/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://njostemejournal.com.ng/journals</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://njostemejournal.com.ng/archive</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://njostemejournal.com.ng/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://njostemejournal.com.ng/guide</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://njostemejournal.com.ng/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://njostemejournal.com.ng/editorial-board</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    
    // Add individual journal URLs
    journals.forEach(journal => {
      const lastMod = journal.publishedDate ? new Date(journal.publishedDate).toISOString() : new Date().toISOString();
      sitemapXML += `  <url>
    <loc>https://njostemejournal.com.ng/journals/${journal._id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });
    
    sitemapXML += `</urlset>`;
    
    // Write sitemap to file
    const sitemapPath = path.join(__dirname, '../njestemefrontend/public/sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXML);
    
    console.log(`Sitemap generated successfully with ${journals.length} journal entries`);
    console.log(`Sitemap written to: ${sitemapPath}`);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  } finally {
    // Close database connection if it exists
    if (connection) {
      console.log('Closing MongoDB connection...');
      await connection.connection.close();
    }
  }
};

// Run the script
console.log('Starting sitemap generation...');
generateSitemap();
