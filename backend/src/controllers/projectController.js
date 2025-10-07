/**
 * CONTROLLER DE PROJETOS
 * Lógica de negócio para Solutions, Progress e Impact
 */

const { db } = require('../config/firebase');

// Referência à coleção 'projects' no Firestore
const projectsCollection = db.collection('projects');

// ===============================
// FUNÇÕES AUXILIARES
// ===============================

/**
 * Valida se a categoria é válida
 */
const isValidCategory = (category) => {
  const validCategories = ['solutions', 'progress', 'impact'];
  return validCategories.includes(category);
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
exports.getAllProjects = async (req, res) => {
  try {
    const { category, limit = 50, orderBy = 'createdAt' } = req.query;
    
    let query = projectsCollection;
    
    // Filtrar por categoria se fornecida
    if (category && isValidCategory(category)) {
      query = query.where('category', '==', category);
    }
    
    // Ordenar e limitar
    query = query.orderBy(orderBy, 'desc').limit(parseInt(limit));
    
    // Executar query
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Formatar resultados
    const projects = snapshot.docs.map(doc => formatProject(doc));
    
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
exports.getProjectById = async (req, res) => {
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
 * Retorna projetos por categoria
 */
exports.getProjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida. Use: solutions, progress ou impact'
      });
    }
    
    const snapshot = await projectsCollection
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .get();
    
    const projects = snapshot.docs.map(doc => formatProject(doc));
    
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
 * POST /api/projects
 * Cria um novo projeto
 */
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      imageUrl,
      progress = 0,
      completionDate,
      metrics = {}
    } = req.body;
    
    // Validações
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, description, category'
      });
    }
    
    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida. Use: solutions, progress ou impact'
      });
    }
    
    // Criar projeto
    const projectData = {
      title,
      description,
      category,
      imageUrl: imageUrl || '',
      progress: parseInt(progress),
      completionDate: completionDate || null,
      metrics,
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
exports.updateProject = async (req, res) => {
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
        error: 'Categoria inválida'
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
exports.deleteProject = async (req, res) => {
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
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progresso deve ser um número entre 0 e 100'
      });
    }
    
    await projectsCollection.doc(id).update({
      progress,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Progresso atualizado!',
      data: { id, progress }
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