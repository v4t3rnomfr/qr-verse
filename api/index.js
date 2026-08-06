/**
 * QRVerse - Vercel Serverless Entry Point
 * Delegates all requests to the Express app defined in ../server.js
 */

const app = require('../server.js');

module.exports = app;