/**
 * SERVIDOR PRINCIPAL DA API
 * Problem Solver Foundation Backend
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rotas
const projectRoutes = require('./routes/projects');
const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARES
// ===============================

// Permitir requisições de qualquer origem (CORS)
app.use(cors());

// Permitir receber JSON no body das requisições
app.use(express.json());

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

// Rotas da API
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

module.exports = app;