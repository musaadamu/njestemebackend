const mongoose = require('mongoose');
const path = require('path');

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
    
    const conn = await mongoose.connect(mongoUri, {
      // Remove deprecated options
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Test function to fetch journals
const testJournals = async () => {
  let connection;
  try {
    connection = await connectDB();
    
    // Fetch all published journals
    const journals = await Journal.find({ status: 'published' }, '_id title publishedDate').limit(5);
    console.log(`Found ${journals.length} published journals`);
    
    journals.forEach(journal => {
      console.log(`- ${journal.title} (${journal._id}) - ${journal.publishedDate}`);
    });
    
    // Close database connection
    if (connection) {
      await connection.connection.close();
    }
  } catch (error) {
    console.error('Error fetching journals:', error);
    // Close database connection even if there's an error
    if (connection) {
      await connection.connection.close();
    }
    process.exit(1);
  }
};

// Run the test
testJournals();
