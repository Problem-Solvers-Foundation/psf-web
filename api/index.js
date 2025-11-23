/**
 * Serverless Function para Vercel
 * Este arquivo adapta o servidor Express para rodar como serverless function
 */

// Set Vercel environment flag before any imports
process.env.VERCEL = '1';

import app from '../backend/src/server.js';

export default app;
