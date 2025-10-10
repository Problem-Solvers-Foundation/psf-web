/**
 * SCRIPT PRINCIPAL PARA PÁGINAS DE PROJETOS
 * Solutions, Progress e Impact
 */

/**
 * Renderiza um card de projeto
 * @param {object} project - Dados do projeto
 * @returns {string} - HTML do card
 */
function renderProjectCard(project) {
  const { 
    id, 
    title, 
    description, 
    imageUrl, 
    progress, 
    completionDate, 
    category,
    metrics 
  } = project;
  
  return `
    <div class="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/20">
      <!-- Imagem -->
      <div class="mb-4 aspect-video w-full overflow-hidden rounded-lg">
        <img 
          src="${imageUrl || 'https://via.placeholder.com/400x225'}" 
          alt="${title}"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onerror="this.src='https://via.placeholder.com/400x225?text=No+Image'"
        />
      </div>
      
      <!-- Categoria Badge -->
      <span class="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        ${category.toUpperCase()}
      </span>
      
      <!-- Título -->
      <h3 class="mt-3 text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
        ${title}
      </h3>
      
      <!-- Descrição -->
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        ${Utils.truncateText(description, 120)}
      </p>
      
      <!-- Progresso -->
      ${progress !== undefined ? `
        <div class="mt-4">
          <div class="mb-2 flex items-center justify-between text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300">Progresso</span>
            <span class="font-bold text-primary">${progress}%</span>
          </div>
          <div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              class="${Utils.getProgressColor(progress)} h-2 rounded-full transition-all duration-500"
              style="width: ${progress}%"
            ></div>
          </div>
          ${completionDate ? `
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Conclusão estimada: ${completionDate}
            </p>
          ` : ''}
        </div>
      ` : ''}
      
      <!-- Métricas -->
      ${metrics ? `
        <div class="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          ${metrics.livesImpacted ? `
            <div class="text-center">
              <p class="text-2xl font-bold text-primary">${Utils.formatNumber(metrics.livesImpacted)}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Vidas Impactadas</p>
            </div>
          ` : ''}
          ${metrics.volunteersInvolved ? `
            <div class="text-center">
              <p class="text-2xl font-bold text-primary">${Utils.formatNumber(metrics.volunteersInvolved)}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Voluntários</p>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <!-- Botão Ver Mais (opcional) -->
      <button 
        onclick="viewProjectDetails('${id}')"
        class="mt-4 w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white dark:bg-primary/20"
      >
        Ver Detalhes →
      </button>
    </div>
  `;
}

/**
 * Carrega e exibe projetos de uma categoria
 * @param {string} category - Categoria dos projetos
 * @param {string} containerId - ID do container HTML
 */
async function loadProjectsByCategory(category, containerId) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container ${containerId} não encontrado`);
    return;
  }
  
  // Mostrar loading
  Utils.showLoading(containerId);
  
  try {
    // Buscar projetos da API
    const response = await ProjectsAPI.getByCategory(category);
    
    // Verificar se há projetos
    if (!response.success || !response.data || response.data.length === 0) {
      Utils.showEmptyState(
        containerId, 
        `Nenhum projeto encontrado na categoria "${category}"`
      );
      return;
    }
    
    // Renderizar projetos
    const projectsHTML = response.data.map(project => renderProjectCard(project)).join('');
    
    container.innerHTML = `
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${projectsHTML}
      </div>
    `;
    
    console.log(`✅ ${response.data.length} projeto(s) carregado(s) - categoria: ${category}`);
    
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    Utils.showError(containerId, 'Erro ao carregar projetos. Verifique se a API está rodando.');
  }
}

/**
 * Carrega todos os projetos
 * @param {string} containerId - ID do container HTML
 */
async function loadAllProjects(containerId) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container ${containerId} não encontrado`);
    return;
  }
  
  Utils.showLoading(containerId);
  
  try {
    const response = await ProjectsAPI.getAll();
    
    if (!response.success || !response.data || response.data.length === 0) {
      Utils.showEmptyState(containerId, 'Nenhum projeto encontrado');
      return;
    }
    
    const projectsHTML = response.data.map(project => renderProjectCard(project)).join('');
    
    container.innerHTML = `
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${projectsHTML}
      </div>
    `;
    
    console.log(`✅ ${response.data.length} projeto(s) carregado(s)`);
    
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    Utils.showError(containerId);
  }
}

/**
 * Ver detalhes de um projeto
 * @param {string} projectId - ID do projeto
 */
async function viewProjectDetails(projectId) {
  try {
    // Buscar dados completos do projeto
    const response = await ProjectsAPI.getById(projectId);

    if (response.success && response.data) {
      // Verificar se a função openProjectModal existe (definida na página HTML)
      if (typeof openProjectModal === 'function') {
        openProjectModal(response.data);
      } else {
        // Fallback caso a função não exista
        console.error('Função openProjectModal não encontrada');
        alert('Erro ao abrir detalhes do projeto');
      }
    } else {
      alert('Projeto não encontrado');
    }

  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
    alert('Erro ao carregar detalhes do projeto. Verifique se a API está rodando.');
  }
}

/**
 * Filtrar projetos por busca
 * @param {string} searchTerm - Termo de busca
 * @param {string} containerId - ID do container
 */
async function searchProjects(searchTerm, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  Utils.showLoading(containerId);

  try {
    const response = await ProjectsAPI.getAll();

    if (!response.success || !response.data) {
      Utils.showError(containerId);
      return;
    }

    // Filtrar projetos localmente
    const filtered = response.data.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
      Utils.showEmptyState(containerId, `Nenhum projeto encontrado para "${searchTerm}"`);
      return;
    }

    const projectsHTML = filtered.map(project => renderProjectCard(project)).join('');

    container.innerHTML = `
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${projectsHTML}
      </div>
    `;

  } catch (error) {
    console.error('Erro na busca:', error);
    Utils.showError(containerId);
  }
}

/**
 * Carrega projetos com status active ou completed (para página Solutions)
 * @param {string} containerId - ID do container HTML
 */
async function loadActiveAndCompletedProjects(containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} não encontrado`);
    return;
  }

  Utils.showLoading(containerId);

  try {
    // Buscar projetos com status active e completed em paralelo
    const [activeResponse, completedResponse] = await Promise.all([
      fetch(`${API_CONFIG.baseURL}/projects?status=active`),
      fetch(`${API_CONFIG.baseURL}/projects?status=completed`)
    ]);

    // Verificar se as requisições foram bem-sucedidas
    if (!activeResponse.ok || !completedResponse.ok) {
      throw new Error('Erro ao buscar projetos da API');
    }

    const activeData = await activeResponse.json();
    const completedData = await completedResponse.json();

    // Combinar os projetos dos dois status
    const allProjects = [
      ...(activeData.data || []),
      ...(completedData.data || [])
    ];

    // Verificar se há projetos para exibir
    if (allProjects.length === 0) {
      Utils.showEmptyState(
        containerId,
        'Nenhum projeto ativo ou concluído disponível no momento'
      );
      return;
    }

    // Ordenar por data de criação (mais recente primeiro)
    allProjects.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Renderizar os cards
    const projectsHTML = allProjects.map(project => renderProjectCard(project)).join('');

    container.innerHTML = `
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        ${projectsHTML}
      </div>
    `;

    console.log(`✅ ${allProjects.length} projeto(s) carregado(s) (active: ${activeData.data.length}, completed: ${completedData.data.length})`);

  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    Utils.showError(
      containerId,
      'Erro ao carregar projetos. Verifique se a API está rodando.'
    );
  }
}

// Exportar funções para uso global
window.ProjectsUI = {
  loadProjectsByCategory,
  loadAllProjects,
  loadActiveAndCompletedProjects,
  viewProjectDetails,
  searchProjects,
  renderProjectCard
};

console.log('✅ projects.js carregado com sucesso!');