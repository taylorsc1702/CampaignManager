import { createRequestHandler } from '@react-router/node';

// Import the built server
import build from '../build/server/index.js';

// Create the request handler
const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV || 'production',
});

// Export as Vercel function
export default handler;
