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
import projectRoutes from './routes/projects.js';
import blogRoutes from './routes/blog.js';
import authRoutes from './routes/auth.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';

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

// Permitir requisições de qualquer origem (CORS)
app.use(cors());

// Permitir receber JSON no body das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sessões (para autenticação admin)
app.use(session({
  secret: process.env.SESSION_SECRET || 'psf-blog-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // HTTPS apenas em produção
  }
}));

// Servir arquivos estáticos (CSS, JS, imagens)
app.use('/public', express.static(path.join(__dirname, '../../frontend/public')));

// Middleware para log de requisições (útil para debug)
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ===============================
// ROTAS
// ===============================

// Rota de teste
app.get('/', (_req, res) => {
  res.json({
    message: '🚀 API Problem Solver Foundation',
    version: '1.0.0',
    endpoints: {
      projects: '/api/projects',
      blog: '/api/blog',
      auth: '/api/auth',
      stats: '/api/stats'
    }
  });
});

// Rotas SSR (Server-Side Rendering) - HTML renderizado
app.use('/blog', blogRoutes);
app.use('/admin', adminRoutes);

// Rotas da API (JSON)
app.use('/api/projects', projectRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

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