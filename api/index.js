/**
 * Serverless Function para Vercel
 * Este arquivo adapta o servidor Express para rodar como serverless function
 */

import app from '../backend/src/server.js';

// Exporta o app do Express como serverless function
export default app;
