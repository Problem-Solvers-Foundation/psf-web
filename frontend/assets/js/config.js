/**
 * CONFIGURAÇÃO DA API
 * Centralize as URLs e configurações aqui
 */

const API_CONFIG = {
  // URL base da API (mude para produção depois)
  baseURL: 'http://localhost:3000/api',
  
  // Endpoints
  endpoints: {
    projects: '/projects',
    projectsByCategory: (category) => `/projects/category/${category}`,
    projectById: (id) => `/projects/${id}`,
    blog: '/blog',
    auth: '/auth',
    stats: '/stats'
  },
  
  // Timeout para requisições (ms)
  timeout: 10000,
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Função auxiliar para fazer requisições
 * @param {string} endpoint - Endpoint da API
 * @param {object} options - Opções do fetch
 * @returns {Promise} - Promise com os dados
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers
      }
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Funções específicas para projetos
 */
const ProjectsAPI = {
  // Buscar todos os projetos
  getAll: async () => {
    return await apiRequest(API_CONFIG.endpoints.projects);
  },
  
  // Buscar projetos por categoria
  getByCategory: async (category) => {
    return await apiRequest(API_CONFIG.endpoints.projectsByCategory(category));
  },
  
  // Buscar projeto por ID
  getById: async (id) => {
    return await apiRequest(API_CONFIG.endpoints.projectById(id));
  },
  
  // Criar novo projeto
  create: async (projectData) => {
    return await apiRequest(API_CONFIG.endpoints.projects, {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },
  
  // Atualizar projeto
  update: async (id, projectData) => {
    return await apiRequest(API_CONFIG.endpoints.projectById(id), {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  },
  
  // Deletar projeto
  delete: async (id) => {
    return await apiRequest(API_CONFIG.endpoints.projectById(id), {
      method: 'DELETE'
    });
  }
};

/**
 * Funções específicas para estatísticas
 */
const StatsAPI = {
  // Buscar estatísticas gerais
  getStats: async () => {
    return await apiRequest(API_CONFIG.endpoints.stats);
  },

  // Buscar estatísticas por categoria
  getByCategory: async (category) => {
    return await apiRequest(`${API_CONFIG.endpoints.stats}/category/${category}`);
  }
};

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
window.ProjectsAPI = ProjectsAPI;
window.StatsAPI = StatsAPI;