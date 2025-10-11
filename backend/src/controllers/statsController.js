/**
 * CONTROLLER DE ESTATÍSTICAS
 * Calcula e retorna métricas agregadas do sistema
 * ATUALIZADO: Otimizado para performance com cálculos no backend
 */
import { db } from '../config/firebase.js';

const projectsCollection = db.collection('projects');

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