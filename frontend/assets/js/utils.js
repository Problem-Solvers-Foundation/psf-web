/**
 * UTILITÁRIOS E FUNÇÕES AUXILIARES
 * Funções reutilizáveis em todo o projeto
 */

/**
 * Mostra um loading spinner
 * @param {string} containerId - ID do container onde mostrar o loading
 */
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <span class="ml-3 text-lg">Carregando...</span>
    </div>
  `;
}

/**
 * Mostra uma mensagem de erro
 * @param {string} containerId - ID do container
 * @param {string} message - Mensagem de erro
 */
function showError(containerId, message = 'Erro ao carregar dados') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="rounded-lg bg-red-50 dark:bg-red-900/20 p-6 text-center">
      <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="mt-4 text-lg font-medium text-red-800 dark:text-red-200">${message}</p>
      <button onclick="location.reload()" class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
        Tentar Novamente
      </button>
    </div>
  `;
}

/**
 * Mostra mensagem quando não há dados
 * @param {string} containerId - ID do container
 * @param {string} message - Mensagem personalizada
 */
function showEmptyState(containerId, message = 'Nenhum dado encontrado') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="rounded-lg bg-gray-50 dark:bg-gray-900/20 p-12 text-center">
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">${message}</p>
    </div>
  `;
}

/**
 * Formata número grande (ex: 15000 → 15K)
 * @param {number} num - Número para formatar
 * @returns {string} - Número formatado
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Formata data para formato legível
 * @param {string|Date} date - Data para formatar
 * @returns {string} - Data formatada
 */
function formatDate(date) {
  if (!date) return 'Data não disponível';
  
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return d.toLocaleDateString('pt-BR', options);
}

/**
 * Trunca texto longo
 * @param {string} text - Texto para truncar
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} - Texto truncado
 */
function truncateText(text, maxLength = 150) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Validação de categoria de projeto
 * @param {string} category - Categoria para validar
 * @returns {boolean} - True se válida
 */
function isValidCategory(category) {
  const validCategories = ['solutions', 'progress', 'impact'];
  return validCategories.includes(category);
}

/**
 * Obtém cor do progresso baseado na porcentagem
 * @param {number} progress - Porcentagem (0-100)
 * @returns {string} - Classe CSS da cor
 */
function getProgressColor(progress) {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Debounce para otimizar buscas
 * @param {Function} func - Função para executar
 * @param {number} wait - Tempo de espera (ms)
 * @returns {Function} - Função com debounce
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Copia texto para clipboard
 * @param {string} text - Texto para copiar
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  } catch (err) {
    console.error('Erro ao copiar:', err);
  }
}

/**
 * Scroll suave para elemento
 * @param {string} elementId - ID do elemento
 */
function smoothScrollTo(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Exportar funções para uso global
window.Utils = {
  showLoading,
  showError,
  showEmptyState,
  formatNumber,
  formatDate,
  truncateText,
  isValidCategory,
  getProgressColor,
  debounce,
  copyToClipboard,
  smoothScrollTo
};