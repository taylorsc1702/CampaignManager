const { createRequestHandler } = require('@react-router/node');

// Import the built server
const build = require('../build/server/index.js');

// Create the request handler
const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || 'production',
});

module.exports = handler;
