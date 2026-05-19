/**
 * SERVIDOR PRINCIPAL DA API
 * Problem Solver Foundation Backend
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
import { db } from './config/firebase.js';

const require = createRequire(import.meta.url);
const FirestoreStore = require('connect-session-firestore')(session);

// Carregar variáveis de ambiente
dotenv.config();


// Para usar __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importar rotas
import publicRoutes from './routes/public.js';
import projectRoutes from './routes/projects.js';
import blogRoutes from './routes/blog.js';
import authRoutes from './routes/auth.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import applicationsRoutes from './routes/applications.js';
import contactRoutes from './routes/contact.js';

// Importar middlewares de tratamento de erros
import {
  handle404,
  handle500,
  securityHeaders,
  sanitizeInputs
} from './middleware/errorHandler.js';

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// CONFIGURAÇÃO DO EJS (Template Engine)
// ===============================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===============================
// MIDDLEWARES
// ===============================
// Trust proxy for deployment platforms (Vercel, etc)
app.set('trust proxy', 1);

// CORS configuration - Allow requests from specific origins
const allowedOrigins = [
  'http://localhost:3000',                   // Local development
  'http://localhost:5173'                    // Vite dev server (if used)
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Por enquanto, permitir todas (ajustar depois se necessário)
    }
  },
  credentials: true
}));

// Permitir receber JSON no body das requisições com limite e handling de charset
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Verificar se o buffer contém caracteres válidos UTF-8
    try {
      if (encoding === 'utf8' && buf && buf.length > 0) {
        // Tentar decodificar e detectar caracteres surrogates inválidos
        const text = buf.toString('utf8');
        // Remover caracteres surrogate não emparelhados
        const sanitized = text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
        // Atualizar o buffer com o texto sanitizado
        if (sanitized !== text) {
          req.rawBody = Buffer.from(sanitized, 'utf8');
        }
      }
    } catch (error) {
      console.warn('⚠️ Warning: Error validating JSON charset:', error.message);
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aplicar headers de segurança e sanitização de inputs
app.use(securityHeaders);
app.use(sanitizeInputs);

const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

app.use(session({
  store: new FirestoreStore({ database: db, sessions: 'sessions' }),
  secret: process.env.SESSION_SECRET || 'psf-blog-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax'
  }
}));

// Servir arquivos estáticos (CSS, JS, imagens)
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));

// Favicon route - Serve favicon from assets directory
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/assets/favicon.ico'));
});

// Middleware para log de requisições (útil para debug)
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ===============================
// ROTAS
// ===============================

// Rotas da API (JSON) - Prioridade alta
app.use('/api/projects', projectRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/contact', contactRoutes);

// Rotas SSR (Server-Side Rendering) - HTML renderizado
app.use('/blog', blogRoutes);
app.use('/admin', adminRoutes);

// Rotas Públicas (DEVE VIR POR ÚLTIMO para não sobrescrever outras rotas)
app.use('/', publicRoutes);

// ===============================
// TRATAMENTO DE ERROS
// ===============================

// Rota não encontrada (404) - com sanitização e página personalizada
app.use(handle404);

// Erro geral do servidor (500) - com sanitização e página personalizada
app.use(handle500);

// ===============================
// INICIAR SERVIDOR
// ===============================

// Só inicia o servidor se NÃO estiver no Vercel (serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
  });
}

export default app;
