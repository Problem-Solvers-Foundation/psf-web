/**
 * CONTROLLER ADMIN
 * Lógica para o painel administrativo
 */
import { db } from '../config/firebase.js';
import bcrypt from 'bcryptjs';

const postsCollection = db.collection('posts');
const projectsCollection = db.collection('projects');
const usersCollection = db.collection('users');
const applicationsCollection = db.collection('applications');

// IMPORTANTE: ADMIN_EMAIL e ADMIN_PASSWORD não são mais utilizados
// Todo o sistema de autenticação agora usa apenas bcrypt com senhas hashadas no banco de dados

/**
 * GET /admin/login
 * Renderiza página de login
 */
export const showLogin = (req, res) => {
  res.render('admin/login', { error: null });
};

/**
 * POST /admin/login
 * Processa login
 */
export const processLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário no banco de dados pelo email
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verificar se o usuário está ativo
    if (!userData.isActive) {
      return res.render('admin/login', { error: 'Account is inactive. Contact administrator.' });
    }

    // Comparar senha usando bcrypt
    // SEGURANÇA: Todas as senhas devem estar hashadas no banco de dados
    if (!userData.password) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    // Atualizar último login
    await usersCollection.doc(userDoc.id).update({
      lastLogin: new Date()
    });

    // Criar sessão
    req.session.isAuthenticated = true;
    req.session.user = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    };

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error during login:', error);
    res.render('admin/login', { error: 'An error occurred. Please try again.' });
  }
};

/**
 * GET /admin/logout
 * Faz logout
 */
export const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

/**
 * GET /admin/dashboard
 * Dashboard principal com estatísticas gerais
 */
export const showDashboard = async (req, res) => {
  try {
    // Buscar posts
    const postsSnapshot = await postsCollection.get();
    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Buscar projects
    const projectsSnapshot = await projectsCollection.get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Buscar users
    const usersSnapshot = await usersCollection.get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    res.render('admin/dashboard', { posts, projects, users });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
};

/**
 * GET /admin/posts
 * Listagem de posts (separado do dashboard)
 */
export const showPosts = async (req, res) => {
  try {
    const snapshot = await postsCollection.get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Ordenar por data (mais recente primeiro)
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('admin/posts', { posts });
  } catch (error) {
    console.error('Error loading posts:', error);
    res.status(500).send('Error loading posts');
  }
};

/**
 * GET /admin/posts/new
 * Formulário para criar novo post
 */
export const showNewPostForm = (req, res) => {
  res.render('admin/post-editor', { post: null });
};

/**
 * POST /admin/posts/create
 * Cria novo post
 */
export const createPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, author, imageUrl, tags, isPublished } = req.body;

    const postData = {
      title,
      slug,
      excerpt,
      content,
      category,
      author,
      imageUrl: imageUrl || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      isPublished: isPublished === 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await postsCollection.add(postData);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).send('Error creating post');
  }
};

/**
 * GET /admin/posts/edit/:id
 * Formulário para editar post
 */
export const showEditPostForm = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await postsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('Post not found');
    }

    const post = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    };

    res.render('admin/post-editor', { post });
  } catch (error) {
    console.error('Error loading post:', error);
    res.status(500).send('Error loading post');
  }
};

/**
 * POST /admin/posts/edit/:id
 * Atualiza post existente
 */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, category, author, imageUrl, tags, isPublished } = req.body;

    const updateData = {
      title,
      slug,
      excerpt,
      content,
      category,
      author,
      imageUrl: imageUrl || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      isPublished: isPublished === 'true',
      updatedAt: new Date()
    };

    await postsCollection.doc(id).update(updateData);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).send('Error updating post');
  }
};

/**
 * POST /admin/posts/delete/:id
 * Deleta post
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await postsCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /admin/posts/toggle/:id
 * Alterna o status de publicação do post (rascunho ↔ publicado)
 */
export const togglePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await postsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const currentStatus = doc.data().isPublished;
    await postsCollection.doc(id).update({
      isPublished: !currentStatus,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      newStatus: !currentStatus,
      message: `Post ${!currentStatus ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Error toggling post status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /admin/posts/preview/:id
 * Pré-visualiza um post (rascunho ou publicado)
 */
export const previewPost = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await postsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('Post not found');
    }

    const post = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    };

    // Renderizar página de blog post
    res.render('blog/post', { post });
  } catch (error) {
    console.error('Error loading preview:', error);
    res.status(500).send('Error loading preview');
  }
};

// ===============================
// GERENCIAMENTO DE PROJETOS
// ===============================

/**
 * GET /admin/projects
 * Dashboard de projetos
 */
export const showProjects = async (req, res) => {
  try {
    const snapshot = await projectsCollection.get();
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Ordenar por data (mais recente primeiro)
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('admin/projects', { projects });
  } catch (error) {
    console.error('Error loading projects:', error);
    res.status(500).send('Error loading projects');
  }
};

/**
 * GET /admin/projects/new
 * Formulário para criar novo projeto
 */
export const showNewProjectForm = (req, res) => {
  res.render('admin/project-editor', { project: null });
};

/**
 * POST /admin/projects/create
 * Cria novo projeto
 */
export const createProject = async (req, res) => {
  try {
    const { title, description, category, status, imageUrl, progress, completionDate, livesImpacted, volunteersInvolved } = req.body;

    // Validar e limitar progress entre 0 e 100
    let validProgress = parseInt(progress) || 0;
    if (validProgress < 0) validProgress = 0;
    if (validProgress > 100) validProgress = 100;

    const projectData = {
      title,
      description,
      category,
      status: status || 'active',
      imageUrl: imageUrl || '',
      progress: validProgress,
      completionDate: completionDate || null,
      metrics: {
        livesImpacted: parseInt(livesImpacted) || 0,
        volunteersInvolved: parseInt(volunteersInvolved) || 0
      },
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await projectsCollection.add(projectData);
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).send('Error creating project');
  }
};

/**
 * GET /admin/projects/edit/:id
 * Formulário para editar projeto
 */
export const showEditProjectForm = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await projectsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('Project not found');
    }

    const project = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    };

    res.render('admin/project-editor', { project });
  } catch (error) {
    console.error('Error loading project:', error);
    res.status(500).send('Error loading project');
  }
};

/**
 * POST /admin/projects/edit/:id
 * Atualiza projeto existente
 */
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, status, imageUrl, progress, completionDate, livesImpacted, volunteersInvolved } = req.body;

    // Validar e limitar progress entre 0 e 100
    let validProgress = parseInt(progress) || 0;
    if (validProgress < 0) validProgress = 0;
    if (validProgress > 100) validProgress = 100;

    const updateData = {
      title,
      description,
      category,
      status: status || 'active',
      imageUrl: imageUrl || '',
      progress: validProgress,
      completionDate: completionDate || null,
      metrics: {
        livesImpacted: parseInt(livesImpacted) || 0,
        volunteersInvolved: parseInt(volunteersInvolved) || 0
      },
      updatedAt: new Date()
    };

    await projectsCollection.doc(id).update(updateData);
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).send('Error updating project');
  }
};

/**
 * POST /admin/projects/delete/:id
 * Deleta projeto
 */
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await projectsCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// GERENCIAMENTO DE USUÁRIOS
// ===============================

/**
 * GET /admin/users
 * Dashboard de usuários
 */
export const showUsers = async (req, res) => {
  try {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      lastLogin: doc.data().lastLogin?.toDate()
    }));

    // Ordenar por data de criação
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('admin/users', { users });
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).send('Error loading users');
  }
};

/**
 * POST /admin/users/create
 * Cria novo usuário
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      isActive: true,
      createdAt: new Date(),
      lastLogin: null
    };

    await usersCollection.add(userData);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user');
  }
};

/**
 * GET /admin/users/edit/:id
 * Formulário para editar usuário
 */
export const showEditUserForm = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await usersCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('User not found');
    }

    const user = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    };

    res.render('admin/user-editor', { user });
  } catch (error) {
    console.error('Error loading user:', error);
    res.status(500).send('Error loading user');
  }
};

/**
 * POST /admin/users/edit/:id
 * Atualiza usuário
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, isActive } = req.body;

    const updateData = {
      name,
      email,
      role: role || 'user',
      isActive: isActive === 'true',
      updatedAt: new Date()
    };

    // Se foi fornecida uma nova senha, fazer hash e atualizar
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await usersCollection.doc(id).update(updateData);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Error updating user');
  }
};

/**
 * POST /admin/users/delete/:id
 * Deleta usuário
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await usersCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// GERENCIAMENTO DE APPLICATIONS (CANDIDATURAS)
// ===============================

/**
 * GET /admin/applications
 * Lista de candidaturas
 */
export const showApplications = async (req, res) => {
  try {
    const snapshot = await applicationsCollection.orderBy('submittedAt', 'desc').get();
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    }));

    // Estatísticas
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewing: applications.filter(app => app.status === 'reviewing').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };

    res.render('admin/applications', { applications, stats });
  } catch (error) {
    console.error('Error loading applications:', error);
    res.status(500).send('Error loading applications');
  }
};

/**
 * GET /admin/applications/view/:id
 * Visualizar e editar candidatura específica
 */
export const showApplicationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await applicationsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('Application not found');
    }

    const application = {
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    };

    res.render('admin/application-detail', { application });
  } catch (error) {
    console.error('Error loading application:', error);
    res.status(500).send('Error loading application');
  }
};

/**
 * POST /admin/applications/update/:id
 * Atualiza candidatura (status, notas, campos adicionais)
 */
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, score, interviewDate, priority, tags } = req.body;

    // Construir objeto de atualização apenas com campos fornecidos
    const updateData = {
      updatedAt: new Date()
    };

    // Adicionar apenas campos que foram fornecidos
    if (status) updateData.status = status;
    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;
    if (score !== undefined && score !== '') updateData.score = parseInt(score) || 0;
    if (interviewDate !== undefined && interviewDate !== '') updateData.interviewDate = interviewDate;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;

    // Se status está sendo alterado, adicionar informações de revisão
    if (status && status !== 'pending') {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = req.session.user?.email || 'admin';
    }

    await applicationsCollection.doc(id).update(updateData);

    // Retornar JSON para AJAX ou redirecionar para formulário normal
    if (req.headers['content-type'] === 'application/json') {
      res.json({ success: true, message: 'Application updated successfully' });
    } else {
      res.redirect(`/admin/applications/view/${id}`);
    }
  } catch (error) {
    console.error('Error updating application:', error);

    // Retornar JSON para AJAX ou HTML para formulário normal
    if (req.headers['content-type'] === 'application/json') {
      res.status(500).json({ success: false, error: error.message });
    } else {
      res.status(500).send('Error updating application');
    }
  }
};

/**
 * POST /admin/applications/delete/:id
 * Deleta candidatura
 */
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    await applicationsCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /admin/applications/export/:id/pdf
 * Exporta candidatura para PDF (renderiza HTML para impressão)
 */
export const exportApplicationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await applicationsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('Application not found');
    }

    const application = {
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    };

    // Renderizar página HTML para impressão como PDF
    res.render('admin/application-pdf', { application });
  } catch (error) {
    console.error('Error exporting application:', error);
    res.status(500).send('Error generating PDF');
  }
};