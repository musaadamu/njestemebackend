const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '.env');
console.log('Reading .env file from:', envPath);

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env file contents:');
  console.log(envContent);
} catch (error) {
  console.error('Error reading .env file:', error.message);
}

// Try to load environment variables
require('dotenv').config();

console.log('MONGODB_URI from process.env:', process.env.MONGODB_URI || 'Not set');
console.log('JWT_SECRET from process.env:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('PORT from process.env:', process.env.PORT || 'Not set');
