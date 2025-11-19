/**
 * CONTROLLER DE ESTATÍSTICAS
 * Calcula e retorna métricas agregadas do sistema
 * ATUALIZADO: Otimizado para performance com cálculos no backend
 */
import { db } from '../config/firebase.js';

const projectsCollection = db.collection('projects');
const usersCollection = db.collection('users');

/**
 * GET /api/stats
 * Retorna estatísticas gerais do sistema
 */
export const getStats = async (req, res) => {
  try {
    // Buscar todos os projetos publicados
    const snapshot = await projectsCollection
      .where('isPublished', '==', true)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        data: {
          totalProjects: 0,
          totalLives: 0,
          totalVolunteers: 0,
          avgProgress: 0,
          projectsByCategory: {},
          projectsByStatus: {}
        }
      });
    }

    // Inicializar contadores
    let totalLives = 0;
    let totalVolunteers = 0;
    let totalProgress = 0;
    const categoryCount = {};
    const statusCount = {};

    // Processar cada projeto
    snapshot.docs.forEach(doc => {
      const project = doc.data();

      // Somar métricas de impacto
      totalLives += project.metrics?.livesImpacted || 0;
      totalVolunteers += project.metrics?.volunteersInvolved || 0;
      totalProgress += project.progress || 0;

      // Contar projetos por categoria
      const category = project.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;

      // Contar projetos por status
      const status = project.status || 'active';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const totalProjects = snapshot.size;
    const avgProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

    res.json({
      success: true,
      data: {
        totalProjects,
        totalLives,
        totalVolunteers,
        avgProgress,
        projectsByCategory: categoryCount,
        projectsByStatus: statusCount,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao calcular estatísticas',
      message: error.message
    });
  }
};

/**
 * GET /api/stats/category/:category
 * Retorna estatísticas de uma categoria específica
 */
export const getStatsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const snapshot = await projectsCollection
      .where('category', '==', category)
      .where('isPublished', '==', true)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        data: {
          category,
          totalProjects: 0,
          totalLives: 0,
          totalVolunteers: 0,
          avgProgress: 0
        }
      });
    }

    let totalLives = 0;
    let totalVolunteers = 0;
    let totalProgress = 0;

    snapshot.docs.forEach(doc => {
      const project = doc.data();
      totalLives += project.metrics?.livesImpacted || 0;
      totalVolunteers += project.metrics?.volunteersInvolved || 0;
      totalProgress += project.progress || 0;
    });

    const totalProjects = snapshot.size;
    const avgProgress = Math.round(totalProgress / totalProjects);

    res.json({
      success: true,
      data: {
        category,
        totalProjects,
        totalLives,
        totalVolunteers,
        avgProgress
      }
    });

  } catch (error) {
    console.error('Erro ao calcular estatísticas por categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao calcular estatísticas',
      message: error.message
    });
  }
};

// Cache para estatísticas do dashboard
let cachedDashboardStats = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * GET /api/stats/dashboard
 * Retorna estatísticas específicas para a página about (dashboard dinâmico)
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Verificar se o cache é válido (exceto se force refresh)
    const forceRefresh = req.query.refresh === 'true';
    if (!forceRefresh && cachedDashboardStats && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      return res.json({
        success: true,
        data: {
          ...cachedDashboardStats,
          cached: true,
          lastUpdated: new Date(cacheTime)
        }
      });
    }
    // Buscar usuários ativos
    const usersSnapshot = await usersCollection
      .where('isActive', '==', true)
      .get();

    const activeUsers = usersSnapshot.size;

    // Calcular conexões potenciais usando fórmula n×(n-1)/2
    const potentialConnections = activeUsers > 1 ? (activeUsers * (activeUsers - 1)) / 2 : 0;

    // Buscar projetos ativos
    const activeProjectsSnapshot = await projectsCollection
      .where('status', '==', 'active')
      .where('isPublished', '==', true)
      .get();

    const activeProjects = activeProjectsSnapshot.size;

    // Contar administradores (admin, superuser, superadmin)
    const adminSnapshot = await usersCollection
      .where('role', 'in', ['admin', 'superuser', 'superadmin'])
      .where('isActive', '==', true)
      .get();

    const teamMembers = adminSnapshot.size;

    // Calcular progresso para 2035
    const currentYear = new Date().getFullYear();
    const yearsTo2035 = 2035 - currentYear;
    const goalMembers = 1000000000; // 1 billion
    const progressPercent = Number(((activeUsers / goalMembers) * 100).toFixed(8));

    // Preparar dados para cache
    const statsData = {
      currentNetwork: activeUsers,
      potentialConnections: potentialConnections,
      activeProjects: activeProjects,
      teamMembers: teamMembers > 1 ? `${teamMembers}+` : teamMembers.toString(), // Ofuscar número exato se > 1
      progressPercent: progressPercent,
      progressPercentFormatted: progressPercent < 0.0001 ? '0.0001' : progressPercent.toFixed(4), // Minimum 0.0001% for visibility
      yearsTo2035: yearsTo2035
    };

    // Atualizar cache
    cachedDashboardStats = statsData;
    cacheTime = Date.now();

    res.json({
      success: true,
      data: {
        ...statsData,
        cached: false,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao calcular estatísticas do dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao calcular estatísticas do dashboard',
      message: error.message
    });
  }
};