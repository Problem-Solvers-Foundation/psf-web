/**
 * SCRIPT PARA CARREGAR ESTATÍSTICAS NA HOME PAGE
 * Busca dados do endpoint /api/stats e atualiza o DOM
 */

/**
 * Anima contador de números
 * @param {HTMLElement} element - Elemento a animar
 * @param {number} target - Número final
 * @param {number} duration - Duração em ms
 */
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16); // 60 FPS
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    
    if (current >= target) {
      element.textContent = Utils.formatNumber(target) + '+';
      clearInterval(timer);
    } else {
      element.textContent = Utils.formatNumber(Math.floor(current));
    }
  }, 16);
}

/**
 * Carrega e exibe estatísticas da API
 */
async function loadHomeStats() {
  try {
    console.log('📊 Carregando estatísticas...');
    
    // Buscar stats da API
    const response = await StatsAPI.getStats();
    
    if (!response.success) {
      console.error('❌ Erro ao carregar stats:', response.error);
      return;
    }
    
    const { totalProjects, totalLives, totalVolunteers } = response.data;
    
    console.log('✅ Estatísticas carregadas:', response.data);
    
    // Elementos do DOM
    const projectsElement = document.getElementById('stat-projects');
    const livesElement = document.getElementById('stat-lives');
    const volunteersElement = document.getElementById('stat-volunteers');
    
    // Verificar se elementos existem
    if (!projectsElement || !livesElement || !volunteersElement) {
      console.warn('⚠️ Elementos de estatísticas não encontrados no DOM');
      return;
    }
    
    // Animar contadores com delay escalonado
    setTimeout(() => animateCounter(projectsElement, totalProjects, 1500), 100);
    setTimeout(() => animateCounter(livesElement, totalLives, 2000), 300);
    setTimeout(() => animateCounter(volunteersElement, totalVolunteers, 1800), 500);
    
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    
    // Mostrar valores padrão em caso de erro
    const projectsElement = document.getElementById('stat-projects');
    const livesElement = document.getElementById('stat-lives');
    const volunteersElement = document.getElementById('stat-volunteers');
    
    if (projectsElement) projectsElement.textContent = '150+';
    if (livesElement) livesElement.textContent = '500K+';
    if (volunteersElement) volunteersElement.textContent = '75+';
  }
}

/**
 * Carrega estatísticas por categoria (opcional)
 */
async function loadCategoryBreakdown() {
  try {
    const response = await StatsAPI.getStats();
    
    if (!response.success) return;
    
    const { projectsByCategory } = response.data;
    
    console.log('📊 Projetos por categoria:', projectsByCategory);
    
    // Você pode usar isso para criar gráficos ou outras visualizações
    
  } catch (error) {
    console.error('Erro ao carregar breakdown de categorias:', error);
  }
}

/**
 * Inicializar quando página carregar
 */
if (typeof window !== 'undefined') {
  // Carregar stats quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHomeStats);
  } else {
    loadHomeStats();
  }
}

// Exportar funções para uso externo
window.HomeStats = {
  loadHomeStats,
  loadCategoryBreakdown,
  animateCounter
};

console.log('✅ home-stats.js carregado');