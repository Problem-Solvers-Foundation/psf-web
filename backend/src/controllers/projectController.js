/**
 * CONTROLLER DE PROJETOS
 * Lógica de negócio para projetos da Problem Solver Foundation
 * ATUALIZADO: Categorias por área de atuação + Status do projeto
 */
import { db } from '../config/firebase.js';

// Referência à coleção 'projects' no Firestore
const projectsCollection = db.collection('projects');

// ===============================
// CONSTANTES E VALIDAÇÕES
// ===============================

/**
 * Categorias válidas (Áreas de Atuação)
 */
const VALID_CATEGORIES = [
  'environment',           // Meio Ambiente
  'health',               // Saúde
  'education',            // Educação
  'cybersecurity',        // Segurança Cibernética
  'poverty',              // Combate à Pobreza
  'technology',           // Tecnologia
  'water',                // Água e Saneamento
  'energy',               // Energia Limpa
  'food',                 // Segurança Alimentar
  'housing',              // Moradia
  'community',            // Desenvolvimento Comunitário
  'women-empowerment',    // Empoderamento Feminino
  'youth-development'     // Desenvolvimento Juvenil
];

/**
 * Status válidos do projeto
 */
const VALID_STATUSES = [
  'planned',    // Planejado (ainda não iniciado)
  'active',     // Ativo (em andamento)
  'completed',  // Concluído
  'paused'      // Pausado
];

/**
 * Valida se a categoria é válida
 */
const isValidCategory = (category) => {
  return VALID_CATEGORIES.includes(category);
};

/**
 * Valida se o status é válido
 */
const isValidStatus = (status) => {
  return VALID_STATUSES.includes(status);
};

/**
 * Formata um documento do Firestore para objeto JavaScript
 */
const formatProject = (doc) => {
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  };
};

// ===============================
// MÉTODOS DO CONTROLLER
// ===============================

/**
 * GET /api/projects
 * Retorna todos os projetos com filtros opcionais
 */
export const getAllProjects = async (req, res) => {
  try {
    const { 
      category,           // Filtrar por área
      status,             // Filtrar por status
      limit = 50, 
      orderBy = 'createdAt' 
    } = req.query;
    
    let query = projectsCollection;
    
    // Filtrar por categoria (área) se fornecida
    if (category && isValidCategory(category)) {
      query = query.where('category', '==', category);
    }
    
    // Filtrar por status se fornecido
    if (status && isValidStatus(status)) {
      query = query.where('status', '==', status);
    }
    
    // Limitar resultados
    query = query.limit(parseInt(limit));
    
    // Executar query
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Formatar e ordenar resultados em JavaScript
    let projects = snapshot.docs.map(doc => formatProject(doc));
    
    // Ordenar manualmente
    projects = projects.sort((a, b) => {
      const dateA = new Date(a[orderBy] || 0);
      const dateB = new Date(b[orderBy] || 0);
      return dateB - dateA; // Mais recente primeiro
    });
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
    
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar projetos',
      message: error.message
    });
  }
};

/**
 * GET /api/projects/:id
 * Retorna um projeto específico
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await projectsCollection.doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: formatProject(doc)
    });
    
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar projeto',
      message: error.message
    });
  }
};

/**
 * GET /api/projects/category/:category
 * Retorna projetos por categoria (área de atuação)
 */
export const getProjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida',
        validCategories: VALID_CATEGORIES
      });
    }
    
    // Query sem orderBy para evitar necessidade de índice composto
    const snapshot = await projectsCollection
      .where('category', '==', category)
      .get();
    
    // Ordenar manualmente em JavaScript
    const projects = snapshot.docs
      .map(doc => formatProject(doc))
      .sort((a, b) => {
        // Ordenar por data de criação (mais recente primeiro)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    
    res.json({
      success: true,
      category,
      count: projects.length,
      data: projects
    });
    
  } catch (error) {
    console.error('Erro ao buscar projetos por categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar projetos',
      message: error.message
    });
  }
};

/**
 * GET /api/projects/status/:status
 * Retorna projetos por status (planned/active/completed/paused)
 */
export const getProjectsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        validStatuses: VALID_STATUSES
      });
    }
    
    const snapshot = await projectsCollection
      .where('status', '==', status)
      .get();
    
    // Ordenar manualmente
    const projects = snapshot.docs
      .map(doc => formatProject(doc))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    
    res.json({
      success: true,
      status,
      count: projects.length,
      data: projects
    });
    
  } catch (error) {
    console.error('Erro ao buscar projetos por status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar projetos',
      message: error.message
    });
  }
};

/**
 * POST /api/projects
 * Cria um novo projeto
 */
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status = 'active',
      imageUrl,
      progress = 0,
      completionDate,
      metrics = {}
    } = req.body;
    
    // Validações obrigatórias
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, description, category'
      });
    }
    
    // Validar categoria
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida',
        validCategories: VALID_CATEGORIES
      });
    }
    
    // Validar status
    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        validStatuses: VALID_STATUSES
      });
    }
    
    // Criar projeto
    const projectData = {
      title,
      description,
      category,              // Área de atuação
      status,                // Status do projeto
      imageUrl: imageUrl || '',
      progress: parseInt(progress),
      completionDate: completionDate || null,
      metrics: {
        livesImpacted: parseInt(metrics.livesImpacted) || 0,
        volunteersInvolved: parseInt(metrics.volunteersInvolved) || 0
      },
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await projectsCollection.add(projectData);
    
    res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso!',
      data: {
        id: docRef.id,
        ...projectData
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar projeto',
      message: error.message
    });
  }
};

/**
 * PUT /api/projects/:id
 * Atualiza um projeto
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar se projeto existe
    const doc = await projectsCollection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }
    
    // Validar categoria se estiver sendo atualizada
    if (updateData.category && !isValidCategory(updateData.category)) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida',
        validCategories: VALID_CATEGORIES
      });
    }
    
    // Validar status se estiver sendo atualizado
    if (updateData.status && !isValidStatus(updateData.status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido',
        validStatuses: VALID_STATUSES
      });
    }
    
    // Atualizar
    const updatedData = {
      ...updateData,
      updatedAt: new Date()
    };
    
    await projectsCollection.doc(id).update(updatedData);
    
    res.json({
      success: true,
      message: 'Projeto atualizado com sucesso!',
      data: { id, ...updatedData }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar projeto',
      message: error.message
    });
  }
};

/**
 * DELETE /api/projects/:id
 * Deleta um projeto
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se existe
    const doc = await projectsCollection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
    }
    
    // Deletar
    await projectsCollection.doc(id).delete();
    
    res.json({
      success: true,
      message: 'Projeto deletado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar projeto',
      message: error.message
    });
  }
};

/**
 * PATCH /api/projects/:id/progress
 * Atualiza apenas o progresso
 */
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progresso deve ser um número entre 0 e 100'
      });
    }
    
    // Atualizar status automaticamente baseado no progresso
    let status = 'active';
    if (progress === 0) status = 'planned';
    if (progress >= 90) status = 'completed';
    
    await projectsCollection.doc(id).update({
      progress,
      status,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Progresso atualizado!',
      data: { id, progress, status }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar progresso',
      message: error.message
    });
  }
};

/**
 * GET /api/projects/categories
 * Retorna lista de categorias válidas
 */
export const getCategories = async (req, res) => {
  res.json({
    success: true,
    data: VALID_CATEGORIES.map(cat => ({
      id: cat,
      name: cat.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }))
  });
};

/**
 * GET /api/projects/statuses
 * Retorna lista de status válidos
 */
export const getStatuses = async (req, res) => {
  res.json({
    success: true,
    data: VALID_STATUSES.map(st => ({
      id: st,
      name: st.charAt(0).toUpperCase() + st.slice(1)
    }))
  });
};