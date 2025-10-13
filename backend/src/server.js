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
// 🔥 ADICIONE ESTA LINHA (crítica para Render.com)
app.set('trust proxy', 1);
// Permitir requisições de qualquer origem (CORS)
// Em produção, especificamos origens permitidas
const allowedOrigins = [
  'https://psf-backend-r6ut.onrender.com',  // Backend URL
  'http://localhost:3000',                   // Desenvolvimento local
  'http://localhost:5173'                    // Vite dev (se usar)
];

// Adicionar Netlify URL quando disponível
if (process.env.NETLIFY_URL) {
  allowedOrigins.push(process.env.NETLIFY_URL);
}

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

// Permitir receber JSON no body das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sessões (para autenticação admin)
app.use(session({
  secret: process.env.SESSION_SECRET || 'psf-blog-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS obrigatório em produção
    sameSite: 'lax' // Usar 'lax' para permitir cookies em redirects no mesmo site
  }
}));

// Servir arquivos estáticos (CSS, JS, imagens)
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));

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

// Rotas SSR (Server-Side Rendering) - HTML renderizado
app.use('/blog', blogRoutes);
app.use('/admin', adminRoutes);

// Rotas Públicas (DEVE VIR POR ÚLTIMO para não sobrescrever outras rotas)
app.use('/', publicRoutes);

// ===============================
// TRATAMENTO DE ERROS
// ===============================

// Rota não encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  });
});

// Erro geral do servidor
app.use((err, _req, res, _next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});

export default app;