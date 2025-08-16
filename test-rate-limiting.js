// Test rate limiting configuration
const express = require('express');
const { publicRateLimit, authRateLimit, adminRateLimit } = require('./middleware/security');

const app = express();

// Test public rate limiting
app.get('/test-public', publicRateLimit, (req, res) => {
    res.json({ message: 'Public endpoint working', timestamp: new Date().toISOString() });
});

// Test auth rate limiting
app.get('/test-auth', authRateLimit, (req, res) => {
    res.json({ message: 'Auth endpoint working', timestamp: new Date().toISOString() });
});

// Test admin rate limiting
app.get('/test-admin', adminRateLimit, (req, res) => {
    res.json({ message: 'Admin endpoint working', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Rate limiting test server running on port ${PORT}`);
    console.log('Test endpoints:');
    console.log(`- Public (2000/15min): http://localhost:${PORT}/test-public`);
    console.log(`- Auth (10/15min): http://localhost:${PORT}/test-auth`);
    console.log(`- Admin (100/1hour): http://localhost:${PORT}/test-admin`);
    console.log('\nPress Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down test server...');
    process.exit(0);
});
