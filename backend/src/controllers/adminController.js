/**
 * CONTROLLER ADMIN
 * Lógica para o painel administrativo
 */
import { db } from '../config/firebase.js';
import bcrypt from 'bcryptjs';
import { recordFailedLogin, clearLoginAttempts } from '../middleware/loginRateLimiter.js';
import {
  sanitizeText,
  sanitizeEmail,
  validateLinkedInUrl,
  validateTwitterUrl,
  validateInstagramUrl,
  sanitizeUrl,
  sanitizeArray,
  sanitizeDate,
  checkProfileUpdateRateLimit
} from '../utils/security.js';

const postsCollection = db.collection('posts');
const projectsCollection = db.collection('projects');
const usersCollection = db.collection('users');
const applicationsCollection = db.collection('applications');
const projectInterestsCollection = db.collection('projectInterests');
const forumsCollection = db.collection('forums');
const discussionsCollection = db.collection('discussions');
const repliesCollection = db.collection('replies');

// IMPORTANTE: ADMIN_EMAIL e ADMIN_PASSWORD não são mais utilizados
// Todo o sistema de autenticação agora usa apenas bcrypt com senhas hashadas no banco de dados

/**
 * GET /signin
 * Renderiza página de login pública
 */
export const showLogin = (req, res) => {
  res.render('public/signin', { error: null });
};

/**
 * POST /signin
 * Processa login público com rate limiting
 */
export const processLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // SEGURANÇA: Validação de input
    if (!email || !password) {
      return res.render('public/signin', {
        error: 'Email and password are required.'
      });
    }

    // SEGURANÇA: Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('public/signin', {
        error: 'Please enter a valid email address.'
      });
    }

    // SEGURANÇA: Sanitizar email
    const sanitizedEmail = email.toLowerCase().trim();

    // Buscar usuário no banco de dados pelo email
    const snapshot = await usersCollection.where('email', '==', sanitizedEmail).limit(1).get();

    if (snapshot.empty) {
      // Registrar tentativa falhada
      const attemptInfo = recordFailedLogin(req);

      let errorMessage = 'Invalid email or password';
      if (attemptInfo.isBlocked) {
        errorMessage = 'Too many login attempts. Please try again in 2 minutes.';
      } else if (attemptInfo.remainingAttempts <= 1) {
        errorMessage = `Invalid email or password. ${attemptInfo.remainingAttempts} attempt${attemptInfo.remainingAttempts === 1 ? '' : 's'} remaining before temporary block.`;
      }

      return res.render('public/signin', { error: errorMessage });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verificar se o usuário está ativo
    if (!userData.isActive) {
      recordFailedLogin(req);
      return res.render('public/signin', { error: 'Account is inactive. Contact administrator.' });
    }

    // Comparar senha usando bcrypt
    // SEGURANÇA: Todas as senhas devem estar hashadas no banco de dados
    if (!userData.password) {
      recordFailedLogin(req);
      return res.render('public/signin', { error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      // Registrar tentativa falhada
      const attemptInfo = recordFailedLogin(req);

      let errorMessage = 'Invalid email or password';
      if (attemptInfo.isBlocked) {
        errorMessage = 'Too many login attempts. Please try again in 2 minutes.';
      } else if (attemptInfo.remainingAttempts <= 1) {
        errorMessage = `Invalid email or password. ${attemptInfo.remainingAttempts} attempt${attemptInfo.remainingAttempts === 1 ? '' : 's'} remaining before temporary block.`;
      }

      return res.render('public/signin', { error: errorMessage });
    }

    // Login bem-sucedido - limpar tentativas
    clearLoginAttempts(req);

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

    // IMPORTANTE: Salvar sessão antes de redirecionar
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('public/signin', { error: 'Session error. Please try again.' });
      }

      // Redirecionar baseado no role do usuário
      if (userData.role === 'user') {
        res.redirect('/admin/community-dashboard');
      } else {
        res.redirect('/admin/dashboard');
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.render('public/signin', { error: 'An error occurred. Please try again.' });
  }
};

/**
 * GET /admin/logout
 * Faz logout
 */
export const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/signin');
};

/**
 * GET /signup
 * Renderiza página de cadastro para community users
 */
export const showSignup = (req, res) => {
  res.render('public/signup', { error: null, success: null, formData: null });
};

/**
 * POST /signup
 * Processa cadastro de community user
 */
export const processSignup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // SEGURANÇA: Validação robusta de input
    if (!name || !email || !password || !confirmPassword) {
      return res.render('public/signup', {
        error: 'All fields are required.',
        success: null,
        formData: { name, email }
      });
    }

    // SEGURANÇA: Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('public/signup', {
        error: 'Please enter a valid email address.',
        success: null,
        formData: { name, email }
      });
    }

    // SEGURANÇA: Sanitizar e validar nome
    const sanitizedName = name.trim().replace(/[<>\"'&]/g, '');
    if (sanitizedName.length < 2 || sanitizedName.length > 50) {
      return res.render('public/signup', {
        error: 'Name must be between 2 and 50 characters.',
        success: null,
        formData: { name, email }
      });
    }

    if (password !== confirmPassword) {
      return res.render('public/signup', {
        error: 'Passwords do not match.',
        success: null,
        formData: { name, email }
      });
    }

    if (password.length < 6) {
      return res.render('public/signup', {
        error: 'Password must be at least 6 characters long.',
        success: null,
        formData: { name, email }
      });
    }

    // Verificar se email já existe
    const existingUserSnapshot = await usersCollection.where('email', '==', email.toLowerCase().trim()).limit(1).get();

    if (!existingUserSnapshot.empty) {
      return res.render('public/signup', {
        error: 'An account with this email already exists.',
        success: null,
        formData: { name, email }
      });
    }

    // Criar novo user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name: sanitizedName, // SEGURANÇA: Usar nome sanitizado
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user', // Community user
      isActive: true,
      createdAt: new Date(),
      lastLogin: null
    };

    await usersCollection.add(newUser);

    res.render('public/signup', {
      error: null,
      success: 'Account created successfully! You can now sign in.',
      formData: null
    });

  } catch (error) {
    console.error('Error during signup:', error);
    res.render('public/signup', {
      error: 'An error occurred while creating your account. Please try again.',
      success: null,
      formData: req.body
    });
  }
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

    console.log('📝 Creating post - Content length:', content ? content.length : 0);
    console.log('Content preview:', content ? content.substring(0, 100) + '...' : 'NO CONTENT');

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

    const docRef = await postsCollection.add(postData);
    console.log('✅ Post created successfully with ID:', docRef.id);

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('❌ Error creating post:', error);
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

    console.log('📝 Updating post', id, '- Content length:', content ? content.length : 0);
    console.log('Content preview:', content ? content.substring(0, 100) + '...' : 'NO CONTENT');

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
    console.log('✅ Post updated successfully');

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('❌ Error updating post:', error);
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

    // Get project interests/candidaturas
    const interestsSnapshot = await projectInterestsCollection
      .where('projectId', '==', id)
      .get();

    const interests = interestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate()
    }));

    // Sort by submission date (most recent first)
    interests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.render('admin/project-editor', {
      project,
      projectInterests: interests
    });
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

    res.render('admin/users', {
      users,
      user: req.session.user // Pass current user for permission checks
    });
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
    const currentUserRole = req.session.user.role;

    // Import permission check
    const { canCreateRole } = await import('../middleware/rolePermissions.js');

    // Check if current user can create this role
    const permissionCheck = canCreateRole(currentUserRole, role);
    if (!permissionCheck.canCreate) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permissionCheck.reason}`
      });
    }

    // Check if email already exists
    const existingUser = await usersCollection.where('email', '==', email).limit(1).get();
    if (!existingUser.empty) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }

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

    res.render('admin/user-editor', {
      user,
      currentUser: req.session.user // Pass current user for permission checks
    });
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
    const currentUserRole = req.session.user.role;
    const currentUserId = req.session.user.id;

    // Import permission checks
    const { canManageUser, canCreateRole } = await import('../middleware/rolePermissions.js');

    // Check if current user can edit this user
    const permissionCheck = await canManageUser(id, currentUserRole, currentUserId, usersCollection);
    if (!permissionCheck.canManage) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permissionCheck.reason}`
      });
    }

    // Check if current user can assign this role
    const roleCheck = canCreateRole(currentUserRole, role);
    if (!roleCheck.canCreate) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${roleCheck.reason}`
      });
    }

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
    const currentUserRole = req.session.user.role;
    const currentUserId = req.session.user.id;

    // Import permission check
    const { canManageUser } = await import('../middleware/rolePermissions.js');

    // Check if current user can delete this user
    const permissionCheck = await canManageUser(id, currentUserRole, currentUserId, usersCollection);
    if (!permissionCheck.canManage) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permissionCheck.reason}`
      });
    }

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

// ===============================
// CONTACT MANAGEMENT
// ===============================

const contactsCollection = db.collection('contacts');

/**
 * GET /admin/contacts
 * Shows list of contact messages
 */
export const showContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const status = req.query.status || 'all'; // all, new, read, archived

    console.log('📋 Fetching contacts - Status filter:', status); // Debug log

    // Get all contacts first (Firestore limitation workaround)
    const allSnapshot = await contactsCollection.get();

    // Count by status
    const statusCounts = {
      all: allSnapshot.size,
      new: 0,
      read: 0,
      archived: 0
    };

    // Filter and count
    let filteredDocs = [];
    allSnapshot.forEach(doc => {
      const contactData = doc.data();
      const contactStatus = contactData.status || 'new';

      // Count
      statusCounts[contactStatus]++;

      // Filter
      if (status === 'all' || contactStatus === status) {
        filteredDocs.push({
          id: doc.id,
          ...contactData,
          submittedAt: contactData.submittedAt
        });
      }
    });

    // Sort by submittedAt (descending - newest first)
    filteredDocs.sort((a, b) => {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return dateB - dateA;
    });

    // Paginate
    const totalContacts = filteredDocs.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const contacts = filteredDocs.slice(startIndex, endIndex);

    console.log('✅ Contacts fetched:', {
      status,
      totalContacts,
      currentPage: page,
      totalPages,
      statusCounts
    }); // Debug log

    res.render('admin/contacts', {
      contacts,
      currentPage: page,
      totalPages,
      totalContacts,
      statusCounts,
      currentStatus: status,
      user: req.session.user
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).send('Error loading contacts');
  }
};

/**
 * GET /admin/contacts/view/:id
 * Shows contact message details
 */
export const showContactDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await contactsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).send('Contact message not found');
    }

    const contact = {
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt
    };

    // Mark as read if it was new
    if (contact.status === 'new') {
      await contactsCollection.doc(id).update({
        status: 'read',
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      contact.status = 'read';
    }

    res.render('admin/contact-detail', {
      contact,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching contact details:', error);
    res.status(500).send('Error loading contact details');
  }
};

/**
 * POST /admin/contacts/update/:id
 * Updates contact message status or notes
 */
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log('Updating contact:', { id, status, notes }); // Debug log

    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'archived') {
        updateData.archivedAt = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    console.log('Update data:', updateData); // Debug log

    await contactsCollection.doc(id).update(updateData);

    console.log('Contact updated successfully'); // Debug log

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /admin/contacts/delete/:id
 * Deletes contact message
 */
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await contactsCollection.doc(id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ===============================
// PROFILE MANAGEMENT
// ===============================

/**
 * GET /admin/profile
 * Shows profile edit form
 */
export const showProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userDoc = await usersCollection.doc(userId).get();

    if (!userDoc.exists) {
      return res.redirect('/admin/logout');
    }

    const userData = userDoc.data();


    res.render('admin/profile', {
      title: 'Edit Profile',
      currentPage: 'profile',
      pageTitle: 'Edit Profile',
      pageDescription: 'Update your name and bio',
      user: {
        id: userDoc.id,
        name: userData.name,
        email: userData.email,
        bio: userData.bio || '',
        role: userData.role,
        // Basic Information
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        linkedinUrl: userData.linkedinUrl || '',
        twitterUrl: userData.twitterUrl || '',
        instagramUrl: userData.instagramUrl || '',
        country: userData.country || '',
        state: userData.state || '',
        city: userData.city || '',
        introduction: userData.introduction || '',
        introVideoUrl: userData.introVideoUrl || '',
        accomplishment: userData.accomplishment || '',
        education: userData.education || '',
        employmentHistory: userData.employmentHistory || '',
        isTechnical: userData.isTechnical || false,
        // Personal Background
        birthdate: userData.birthdate || '',
        gender: userData.gender || '',
        hearAboutPsf: userData.hearAboutPsf || '',
        // Projects and Initiatives
        hasProject: userData.hasProject || '',
        projectName: userData.projectName || '',
        projectDescription: userData.projectDescription || '',
        projectProgress: userData.projectProgress || '',
        projectSupport: userData.projectSupport || '',
        hasCollaborators: userData.hasCollaborators || false,
        fullTimeReadiness: userData.fullTimeReadiness || '',
        responsibilityAreas: userData.responsibilityAreas || [],
        interestedTopics: userData.interestedTopics || [],
        collaborationExpectations: userData.collaborationExpectations || '',
        schedulingUrl: userData.schedulingUrl || '',
        // Motivation and Values
        hobbies: userData.hobbies || '',
        lifePath: userData.lifePath || '',
        additionalInfo: userData.additionalInfo || ''
      },
      from: req.query.from,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).render('admin/dashboard', {
      title: 'Error',
      currentPage: 'dashboard',
      pageTitle: 'Error',
      error: 'Unable to load profile'
    });
  }
};

/**
 * POST /admin/profile
 * Updates user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      currentPassword,
      newPassword,
      confirmNewPassword,
      // Basic Information
      firstName,
      lastName,
      linkedinUrl,
      country,
      state,
      city,
      introduction,
      introVideoUrl,
      accomplishment,
      education,
      employmentHistory,
      isTechnical,
      gender,
      birthdate,
      schedulingUrl,
      twitterUrl,
      instagramUrl,
      hearAboutPsf,
      // Projects and Initiatives
      hasProject,
      projectName,
      projectDescription,
      projectProgress,
      projectSupport,
      hasCollaborators,
      fullTimeReadiness,
      responsibilityAreas,
      interestedTopics,
      collaborationExpectations,
      // Motivation and Values
      hobbies,
      lifePath,
      additionalInfo
    } = req.body;
    const userId = req.session.user.id;
    const fromParam = req.query.from === 'community' ? '&from=community' : '';

    // SECURITY: Rate limiting check
    const rateLimit = checkProfileUpdateRateLimit(userId);
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toLocaleTimeString();
      return res.redirect('/admin/profile?error=' + encodeURIComponent(`Too many profile updates. Try again after ${resetTime}`) + fromParam);
    }

    // SECURITY: Enhanced validation and sanitization
    const sanitizedName = sanitizeText(name, 100);
    if (!sanitizedName || sanitizedName.length < 2) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Name must be at least 2 characters long and contain valid characters') + fromParam);
    }

    const sanitizedBio = sanitizeText(bio, 500);
    if (bio && bio.length > 500) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Bio must be less than 500 characters') + fromParam);
    }

    // SECURITY: URL validations
    const validatedLinkedIn = linkedinUrl ? validateLinkedInUrl(linkedinUrl) : '';
    const validatedTwitter = twitterUrl ? validateTwitterUrl(twitterUrl) : '';
    const validatedInstagram = instagramUrl ? validateInstagramUrl(instagramUrl) : '';
    const validatedScheduling = schedulingUrl ? sanitizeUrl(schedulingUrl) : '';
    const validatedIntroVideo = introVideoUrl ? sanitizeUrl(introVideoUrl) : '';

    // Check if any URL validation failed
    if (linkedinUrl && !validatedLinkedIn) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Invalid LinkedIn URL. Please use a valid LinkedIn profile URL') + fromParam);
    }
    if (twitterUrl && !validatedTwitter) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Invalid Twitter URL. Please use a valid Twitter profile URL') + fromParam);
    }
    if (instagramUrl && !validatedInstagram) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Invalid Instagram URL. Please use a valid Instagram profile URL') + fromParam);
    }
    if (schedulingUrl && !validatedScheduling) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Invalid scheduling URL. Please use a valid URL') + fromParam);
    }
    if (introVideoUrl && !validatedIntroVideo) {
      return res.redirect('/admin/profile?error=' + encodeURIComponent('Invalid video URL. Please use a valid URL') + fromParam);
    }

    // Password change validation
    if (currentPassword || newPassword || confirmNewPassword) {
      // If any password field is filled, all are required
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.redirect('/admin/profile?error=' + encodeURIComponent('All password fields are required when changing password') + fromParam);
      }

      if (newPassword !== confirmNewPassword) {
        return res.redirect('/admin/profile?error=' + encodeURIComponent('New passwords do not match') + fromParam);
      }

      if (newPassword.length < 6) {
        return res.redirect('/admin/profile?error=' + encodeURIComponent('New password must be at least 6 characters long') + fromParam);
      }

      // Verify current password
      const userDoc = await usersCollection.doc(userId).get();
      if (!userDoc.exists) {
        return res.redirect('/admin/profile?error=' + encodeURIComponent('User not found') + fromParam);
      }

      const userData = userDoc.data();
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);

      if (!isCurrentPasswordValid) {
        return res.redirect('/admin/profile?error=' + encodeURIComponent('Current password is incorrect') + fromParam);
      }
    }

    // SECURITY: Sanitize and validate all inputs before database update
    const updateData = {
      name: sanitizedName,
      bio: sanitizedBio,
      // Basic Information
      firstName: sanitizeText(firstName, 50),
      lastName: sanitizeText(lastName, 50),
      linkedinUrl: validatedLinkedIn,
      country: sanitizeText(country, 50),
      state: sanitizeText(state, 50),
      city: sanitizeText(city, 50),
      introduction: sanitizeText(introduction, 1000),
      introVideoUrl: validatedIntroVideo,
      accomplishment: sanitizeText(accomplishment, 200),
      education: sanitizeText(education, 1000),
      employmentHistory: sanitizeText(employmentHistory, 1000),
      isTechnical: isTechnical === 'true' || isTechnical === true,
      gender: sanitizeText(gender, 20),
      birthdate: sanitizeDate(birthdate),
      schedulingUrl: validatedScheduling,
      twitterUrl: validatedTwitter,
      instagramUrl: validatedInstagram,
      hearAboutPsf: sanitizeText(hearAboutPsf, 200),
      // Projects and Initiatives
      hasProject: ['committed', 'ideas', 'none'].includes(hasProject) ? hasProject : '',
      projectName: sanitizeText(projectName, 100),
      projectDescription: sanitizeText(projectDescription, 1000),
      projectProgress: sanitizeText(projectProgress, 500),
      projectSupport: sanitizeText(projectSupport, 500),
      hasCollaborators: hasCollaborators === 'true' || hasCollaborators === true,
      fullTimeReadiness: ['already', 'ready', 'within_year', 'no_plans'].includes(fullTimeReadiness) ? fullTimeReadiness : '',
      responsibilityAreas: sanitizeArray(responsibilityAreas, 10, 50),
      interestedTopics: sanitizeArray(interestedTopics, 10, 50),
      collaborationExpectations: sanitizeText(collaborationExpectations, 1000),
      // Motivation and Values
      hobbies: sanitizeText(hobbies, 500),
      lifePath: sanitizeText(lifePath, 2000),
      additionalInfo: sanitizeText(additionalInfo, 1000),
      updatedAt: new Date()
    };

    // If password is being changed, hash and add to update data
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // SECURITY: Get original data for audit logging
    const originalUserDoc = await usersCollection.doc(userId).get();
    const originalData = originalUserDoc.data();

    await usersCollection.doc(userId).update(updateData);

    // SECURITY: Audit logging
    const auditLog = {
      userId: userId,
      userEmail: originalData.email,
      action: 'profile_update',
      timestamp: new Date(),
      changes: {},
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Track which fields were changed (excluding sensitive ones)
    const fieldsToTrack = [
      'name', 'bio', 'firstName', 'lastName', 'linkedinUrl', 'country',
      'state', 'city', 'introduction', 'accomplishment', 'education',
      'employmentHistory', 'isTechnical', 'gender', 'twitterUrl',
      'instagramUrl', 'hearAboutPsf', 'hasProject', 'projectName'
    ];

    fieldsToTrack.forEach(field => {
      if (originalData[field] !== updateData[field]) {
        auditLog.changes[field] = {
          from: originalData[field] || null,
          to: updateData[field] || null
        };
      }
    });

    // Special handling for password changes
    if (newPassword) {
      auditLog.changes.password = 'changed';
    }

    // Only log if there were actual changes
    if (Object.keys(auditLog.changes).length > 0) {
      try {
        await db.collection('auditLogs').add(auditLog);
        console.log(`📋 Audit log created for user ${originalData.email}: ${Object.keys(auditLog.changes).join(', ')} updated`);
      } catch (auditError) {
        console.error('❌ Failed to create audit log:', auditError);
        // Don't fail the update if audit logging fails
      }
    }

    // Update session data
    req.session.user.name = updateData.name;

    const successMessage = newPassword
      ? 'Profile and password updated successfully'
      : 'Profile updated successfully';

    res.redirect('/admin/profile?success=' + encodeURIComponent(successMessage) + fromParam);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.redirect('/admin/profile?error=' + encodeURIComponent('An error occurred while updating your profile') + fromParam);
  }
};

/**
 * GET /admin/community-dashboard/community
 * Shows community page with user listings and forums
 */
export const showCommunity = async (req, res) => {
  try {
    const { search, location, page = 1 } = req.query;
    const limit = 12; // Users per page
    const offset = (page - 1) * limit;

    // Build query for users
    let usersQuery = usersCollection.where('role', '==', 'user');

    // Apply search filter (name, firstName, lastName)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      // Note: Firestore doesn't support full-text search, so we'll filter in memory
      const allUsersSnapshot = await usersQuery.get();
      const filteredUsers = allUsersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''} ${userData.name || ''}`.toLowerCase();
        return fullName.includes(searchTerm);
      });

      const users = filteredUsers
        .slice(offset, offset + limit)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      return res.render('admin/community', {
        user: req.session.user,
        users: users,
        search: search,
        location: location || '',
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalUsers: filteredUsers.length,
        error: null,
        success: req.query.success || null
      });
    }

    // Apply location filter
    if (location && location.trim()) {
      const locationTerm = location.trim().toLowerCase();
      const allUsersSnapshot = await usersQuery.get();
      const filteredUsers = allUsersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const userLocation = `${userData.country || ''} ${userData.state || ''} ${userData.city || ''}`.toLowerCase();
        return userLocation.includes(locationTerm);
      });

      const users = filteredUsers
        .slice(offset, offset + limit)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      return res.render('admin/community', {
        user: req.session.user,
        users: users,
        search: search || '',
        location: location,
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalUsers: filteredUsers.length,
        error: null,
        success: req.query.success || null
      });
    }

    // Default query - get all community users
    const usersSnapshot = await usersQuery.limit(limit).offset(offset).get();
    const totalUsersSnapshot = await usersQuery.get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get forum discussions for the forums tab
    const discussionsSnapshot = await discussionsCollection
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const discussions = await Promise.all(
      discussionsSnapshot.docs.map(async (doc) => {
        const discussionData = doc.data();

        // Get author information
        const authorDoc = await usersCollection.doc(discussionData.authorId).get();
        const authorData = authorDoc.exists ? authorDoc.data() : null;

        // Get replies count
        const repliesSnapshot = await repliesCollection
          .where('discussionId', '==', doc.id)
          .get();

        return {
          id: doc.id,
          ...discussionData,
          author: authorData ? {
            id: authorDoc.id,
            name: authorData.firstName && authorData.lastName
              ? `${authorData.firstName} ${authorData.lastName}`
              : authorData.name,
            email: authorData.email
          } : { name: 'Unknown User', email: '' },
          repliesCount: repliesSnapshot.docs.length,
          createdAt: discussionData.createdAt
        };
      })
    );

    res.render('admin/community', {
      user: req.session.user,
      users: users,
      discussions: discussions,
      search: search || '',
      location: location || '',
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsersSnapshot.docs.length / limit),
      totalUsers: totalUsersSnapshot.docs.length,
      error: req.query.error || null,
      success: req.query.success || null
    });

  } catch (error) {
    console.error('Error loading community page:', error);
    res.status(500).render('admin/community', {
      user: req.session.user,
      users: [],
      search: '',
      location: '',
      currentPage: 1,
      totalPages: 1,
      totalUsers: 0,
      error: 'An error occurred while loading the community page',
      success: null
    });
  }
};

/**
 * POST /admin/community-dashboard/create-discussion
 * Creates a new discussion in the community forums
 */
export const createDiscussion = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (!title || title.trim().length < 5) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Title must be at least 5 characters long'));
    }

    if (!content || content.trim().length < 10) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Content must be at least 10 characters long'));
    }

    if (title.length > 200) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Title must be less than 200 characters'));
    }

    if (content.length > 5000) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Content must be less than 5000 characters'));
    }

    // Create discussion
    const discussionData = {
      title: sanitizeText(title, 200),
      content: sanitizeText(content, 5000),
      category: sanitizeText(category || 'General', 50),
      authorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocked: false,
      isPinned: false,
      views: 0
    };

    await discussionsCollection.add(discussionData);

    res.redirect('/admin/community-dashboard/community?success=' +
      encodeURIComponent('Discussion created successfully!') + '#forums-tab');

  } catch (error) {
    console.error('Error creating discussion:', error);
    res.redirect('/admin/community-dashboard/community?error=' +
      encodeURIComponent('An error occurred while creating the discussion'));
  }
};

/**
 * POST /admin/community-dashboard/reply-discussion
 * Adds a reply to a discussion
 */
export const replyDiscussion = async (req, res) => {
  try {
    const { discussionId, content } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (!content || content.trim().length < 5) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Reply must be at least 5 characters long') + '#forums-tab');
    }

    if (content.length > 2000) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Reply must be less than 2000 characters') + '#forums-tab');
    }

    // Check if discussion exists
    const discussionDoc = await discussionsCollection.doc(discussionId).get();
    if (!discussionDoc.exists) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Discussion not found') + '#forums-tab');
    }

    const discussionData = discussionDoc.data();
    if (discussionData.isLocked) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('This discussion is locked') + '#forums-tab');
    }

    // Create reply
    const replyData = {
      discussionId: discussionId,
      content: sanitizeText(content, 2000),
      authorId: userId,
      createdAt: new Date()
    };

    await repliesCollection.add(replyData);

    // Update discussion's updatedAt
    await discussionsCollection.doc(discussionId).update({
      updatedAt: new Date()
    });

    res.redirect('/admin/community-dashboard/community?success=' +
      encodeURIComponent('Reply posted successfully!') + '#forums-tab');

  } catch (error) {
    console.error('Error posting reply:', error);
    res.redirect('/admin/community-dashboard/community?error=' +
      encodeURIComponent('An error occurred while posting the reply') + '#forums-tab');
  }
};

/**
 * DELETE /admin/community-dashboard/discussion/:id
 * Delete a discussion (only author can delete)
 */
export const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.session.user.id;

    // Get discussion
    const discussionDoc = await discussionsCollection.doc(id).get();
    if (!discussionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found'
      });
    }

    const discussionData = discussionDoc.data();

    // Check if current user is the author
    if (discussionData.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own discussions'
      });
    }

    // Delete all replies first
    const repliesSnapshot = await repliesCollection
      .where('discussionId', '==', id)
      .get();

    const batch = db.batch();

    // Add all replies to batch delete
    repliesSnapshot.docs.forEach(replyDoc => {
      batch.delete(repliesCollection.doc(replyDoc.id));
    });

    // Add discussion to batch delete
    batch.delete(discussionsCollection.doc(id));

    // Execute batch delete
    await batch.commit();

    console.log('✅ Discussion and replies deleted successfully:', {
      discussionId: id,
      discussionTitle: discussionData.title,
      deletedBy: req.session.user.name,
      repliesDeleted: repliesSnapshot.docs.length
    });

    res.status(200).json({
      success: true,
      message: 'Discussion deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting the discussion'
    });
  }
};

/**
 * GET /admin/community-dashboard/discussion/:id
 * View a specific discussion with replies
 */
export const viewDiscussion = async (req, res) => {
  try {
    const { id } = req.params;

    // Get discussion
    const discussionDoc = await discussionsCollection.doc(id).get();
    if (!discussionDoc.exists) {
      return res.redirect('/admin/community-dashboard/community?error=' +
        encodeURIComponent('Discussion not found'));
    }

    const discussionData = discussionDoc.data();

    // Get author
    const authorDoc = await usersCollection.doc(discussionData.authorId).get();
    const authorData = authorDoc.exists ? authorDoc.data() : null;

    // Increment view count
    await discussionsCollection.doc(id).update({
      views: (discussionData.views || 0) + 1
    });

    // Get replies
    const repliesSnapshot = await repliesCollection
      .where('discussionId', '==', id)
      .orderBy('createdAt', 'asc')
      .get();

    const replies = await Promise.all(
      repliesSnapshot.docs.map(async (doc) => {
        const replyData = doc.data();
        const replyAuthorDoc = await usersCollection.doc(replyData.authorId).get();
        const replyAuthorData = replyAuthorDoc.exists ? replyAuthorDoc.data() : null;

        return {
          id: doc.id,
          ...replyData,
          createdAt: replyData.createdAt?.toDate ? replyData.createdAt.toDate() : replyData.createdAt,
          author: replyAuthorData ? {
            id: replyAuthorDoc.id,
            name: replyAuthorData.firstName && replyAuthorData.lastName
              ? `${replyAuthorData.firstName} ${replyAuthorData.lastName}`
              : replyAuthorData.name,
            email: replyAuthorData.email
          } : { name: 'Unknown User', email: '' }
        };
      })
    );


    const discussion = {
      id: discussionDoc.id,
      ...discussionData,
      createdAt: discussionData.createdAt?.toDate ? discussionData.createdAt.toDate() : discussionData.createdAt,
      updatedAt: discussionData.updatedAt?.toDate ? discussionData.updatedAt.toDate() : discussionData.updatedAt,
      author: authorData ? {
        id: authorDoc.id,
        name: authorData.firstName && authorData.lastName
          ? `${authorData.firstName} ${authorData.lastName}`
          : authorData.name,
        email: authorData.email
      } : { name: 'Unknown User', email: '' }
    };

    res.render('admin/discussion-detail', {
      user: req.session.user,
      discussion: discussion,
      replies: replies,
      error: req.query.error || null,
      success: req.query.success || null
    });

  } catch (error) {
    console.error('Error viewing discussion:', error);
    res.redirect('/admin/community-dashboard/community?error=' +
      encodeURIComponent('An error occurred while loading the discussion'));
  }
};

/**
 * POST /admin/projects/interests/approve/:id
 * Aprova interesse de usuário em projeto
 */
export const approveProjectInterest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if interest exists
    const interestDoc = await projectInterestsCollection.doc(id).get();
    if (!interestDoc.exists) {
      return res.status(404).json({ error: 'Interest not found' });
    }

    // Update interest status
    await projectInterestsCollection.doc(id).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.session.user.id
    });

    const interestData = interestDoc.data();
    console.log('✅ Project interest approved:', {
      projectTitle: interestData.projectTitle,
      userName: interestData.userName,
      approvedBy: req.session.user.name
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error approving project interest:', error);
    res.status(500).json({ error: 'Error approving project interest' });
  }
};

/**
 * POST /admin/projects/interests/reject/:id
 * Rejeita interesse de usuário em projeto
 */
export const rejectProjectInterest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if interest exists
    const interestDoc = await projectInterestsCollection.doc(id).get();
    if (!interestDoc.exists) {
      return res.status(404).json({ error: 'Interest not found' });
    }

    // Update interest status
    await projectInterestsCollection.doc(id).update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: req.session.user.id
    });

    const interestData = interestDoc.data();
    console.log('❌ Project interest rejected:', {
      projectTitle: interestData.projectTitle,
      userName: interestData.userName,
      rejectedBy: req.session.user.name
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error rejecting project interest:', error);
    res.status(500).json({ error: 'Error rejecting project interest' });
  }
};

/**
 * DELETE /admin/projects/interests/delete/:id
 * Exclui interesse de usuário em projeto
 */
export const deleteProjectInterest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if interest exists
    const interestDoc = await projectInterestsCollection.doc(id).get();
    if (!interestDoc.exists) {
      return res.status(404).json({ error: 'Interest not found' });
    }

    const interestData = interestDoc.data();

    // Delete the interest record
    await projectInterestsCollection.doc(id).delete();

    console.log('🗑️ Project interest deleted:', {
      projectTitle: interestData.projectTitle,
      userName: interestData.userName,
      deletedBy: req.session.user.name
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting project interest:', error);
    res.status(500).json({ error: 'Error deleting project interest' });
  }
};

// ===============================
// COMMUNITY DASHBOARD
// ===============================

/**
 * GET /admin/community-dashboard
 * Shows community dashboard for regular users
 */
export const showCommunityDashboard = async (req, res) => {
  try {
    res.render('admin/community-dashboard', {
      title: 'Community Dashboard',
      currentPage: 'community-dashboard',
      user: req.session.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error loading community dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
};