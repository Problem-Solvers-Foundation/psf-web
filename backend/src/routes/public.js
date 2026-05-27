/**
 * ROTAS PÚBLICAS
 * Páginas públicas renderizadas com EJS (Server-Side Rendering)
 */

import express from 'express';
import { db } from '../config/firebase.js';
import { formatNumber } from '../utils/formatNumber.js';

// Auth imports
import * as adminController from '../controllers/adminController.js';
import * as problemController from '../controllers/problemController.js';
import { redirectIfAuthenticated } from '../middleware/auth.js';
import { checkLoginRateLimit } from '../middleware/loginRateLimiter.js';

const router = express.Router();

router.get('/google2d78f42574d66612.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('google-site-verification: google2d78f42574d66612.html');
});

/**
 * GET /robots.txt
 */
router.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /signin',
    'Disallow: /signup',
    'Disallow: /join',
    'Disallow: /application-pending',
    '',
    'Sitemap: https://problemsolverfoundation.vercel.app/sitemap.xml',
  ].join('\n'));
});

/**
 * GET /sitemap.xml
 * Sitemap dinâmico — inclui páginas estáticas + todos os problemas aprovados
 */
router.get('/sitemap.xml', async (req, res) => {
  const base = 'https://problemsolverfoundation.vercel.app';
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/',         priority: '1.0', changefreq: 'weekly'  },
    { url: '/about',    priority: '0.8', changefreq: 'monthly' },
    { url: '/solutions',priority: '0.8', changefreq: 'weekly'  },
    { url: '/impact',   priority: '0.8', changefreq: 'weekly'  },
    { url: '/contact',  priority: '0.6', changefreq: 'monthly' },
    { url: '/problems', priority: '0.9', changefreq: 'daily'   },
  ];

  let problemUrls = [];
  try {
    const snap = await db.collection('problems')
      .where('status', '==', 'approved')
      .get();
    problemUrls = snap.docs.map(doc => {
      const d = doc.data();
      const lastmod = d.updatedAt?.toDate?.() ?? d.createdAt?.toDate?.();
      return {
        url: `/problems/${doc.id}`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: lastmod ? lastmod.toISOString().split('T')[0] : today,
      };
    });
  } catch (e) {
    console.error('Sitemap: error fetching problems', e);
  }

  const allPages = [...staticPages, ...problemUrls];

  const urls = allPages.map(p => `
  <url>
    <loc>${base}${p.url}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

/**
 * HOME PAGE
 * GET /
 */
router.get('/', async (req, res) => {
  try {
    // Buscar todos os projetos
    const projectsSnapshot = await db.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calcular estatísticas
    const totalProjects = projects.length;
    const totalLives = projects.reduce((sum, p) => sum + (p.metrics?.livesImpacted || 0), 0);
    const totalVolunteers = projects.reduce((sum, p) => sum + (p.metrics?.volunteersInvolved || 0), 0);

    const stats = {
      totalProjects: totalProjects,
      totalProjectsFormatted: formatNumber(totalProjects),
      totalLives: totalLives,
      totalLivesFormatted: formatNumber(totalLives),
      totalVolunteers: totalVolunteers,
      totalVolunteersFormatted: formatNumber(totalVolunteers)
    };

    // Buscar os 3 posts publicados mais recentes para "Voices from Our Community"
    const postsSnapshot = await db.collection('posts')
      .where('isPublished', '==', true)
      .get();

    const voicesPosts = postsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    // Renderizar página
    res.render('public/index', {
      layout: 'layouts/public',
      title: 'Problem Solver Foundation - Home',
      description: 'Impact 1 billion people by 2035',
      currentPage: 'home',
      stats: stats,
      voicesPosts: voicesPosts,
      communityError: req.query.communityError || null,
      communitySuccess: req.query.communitySuccess || null,
    });

  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).send('Error loading page');
  }
});

/**
 * ABOUT PAGE
 * GET /about
 */
router.get('/about', (req, res) => {
  res.render('public/about', {
    layout: 'layouts/public',
    title: 'About Us - PSF',
    description: 'Learn more about Problem Solver Foundation',
    currentPage: 'about'
  });
});

/**
 * SOLUTIONS PAGE
 * GET /solutions
 */
router.get('/solutions', async (req, res) => {
  try {
    // Buscar todos os projetos para exibir como soluções
    const solutionsSnapshot = await db.collection('projects')
      .where('isPublished', '==', true)
      .get();

    const solutions = solutionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.render('public/solutions', {
      layout: 'layouts/public',
      title: 'Our Solutions - PSF',
      description: 'Innovative solutions to global challenges',
      currentPage: 'solutions',
      projects: solutions
    });

  } catch (error) {
    console.error('Error loading solutions:', error);
    res.status(500).send('Error loading solutions');
  }
});

/**
 * IMPACT PAGE
 * GET /impact
 */
router.get('/impact', async (req, res) => {
  try {
    // Buscar todos os projetos para calcular estatísticas
    const projectsSnapshot = await db.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calcular estatísticas gerais
    const totalProjects = projects.length;
    const totalLives = projects.reduce((sum, p) => sum + (p.metrics?.livesImpacted || 0), 0);
    const totalVolunteers = projects.reduce((sum, p) => sum + (p.metrics?.volunteersInvolved || 0), 0);

    const stats = {
      totalProjects: totalProjects,
      totalProjectsFormatted: formatNumber(totalProjects),
      totalLives: totalLives,
      totalLivesFormatted: formatNumber(totalLives),
      totalVolunteers: totalVolunteers,
      totalVolunteersFormatted: formatNumber(totalVolunteers)
    };

    // Buscar posts com categoria "Stories" para "Impact Stories"
    const storiesSnapshot = await db.collection('posts')
      .where('category', '==', 'Stories')
      .where('isPublished', '==', true)
      .get();

    const impactStories = storiesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6); // Limitar a 6 posts mais recentes

    res.render('public/impact', {
      title: 'Our Impact - PSF',
      description: 'See the impact we\'re making',
      currentPage: 'impact',
      stats: stats,
      impactStories: impactStories
    });

  } catch (error) {
    console.error('Error loading impact:', error);
    res.status(500).send('Error loading impact');
  }
});

/**
 * CONTACT PAGE
 * GET /contact
 */
router.get('/contact', (req, res) => {
  res.render('public/contact', {
    layout: 'layouts/public',
    title: 'Contact Us - PSF',
    description: 'Get in touch with us',
    currentPage: 'contact'
  });
});

/**
 * JOIN PAGE (Protected)
 * GET /join
 * Requires authentication and pending status
 */
router.get('/join', (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.redirect('/signup');
  }

  // Check if user already has approved status
  if (req.session.user.status === 'approved') {
    return res.redirect('/admin/community-dashboard');
  }

  // Check if user has rejected status
  if (req.session.user.status === 'rejected') {
    return res.redirect('/signin?error=Your application has been rejected. Please contact support for assistance.');
  }

  // Check if user already submitted application
  if (req.session.user.applicationId) {
    return res.redirect('/application-pending');
  }

  res.render('public/join', {
    layout: 'layouts/public',
    title: 'Join Us - PSF',
    description: 'Become a volunteer',
    currentPage: 'join',
    user: req.session.user,
    success: req.query.success || null,
    error: req.query.error || null
  });
});

/**
 * JOIN OPTIONS PAGE
 * GET /join/options
 */
router.get('/join/options', (req, res) => {
  res.render('public/join-options', {
    layout: 'layouts/public',
    title: 'Join Options - PSF',
    description: 'Choose how you want to help',
    currentPage: 'join'
  });
});

// ===============================
// AUTH ROUTES
// ===============================

/**
 * POST /community/join
 * Salva dados no Firestore e redireciona para o Telegram
 */
router.post('/community/join', async (req, res) => {
  const { name, email, location, phone } = req.body;

  if (!name || !email || !location || !phone) {
    return res.redirect('/?communityError=Please+fill+in+all+fields#join-community');
  }

  try {
    await db.collection('community_signups').add({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      location: location.trim(),
      phone:    phone.trim(),
      joinedAt: new Date(),
      source:   'home-page',
    });
  } catch (err) {
    console.error('Error saving community signup:', err);
  }

  return res.redirect('https://t.me/+JpMj8PBVYbNmY2Y5');
});

/**
 * GET /application-pending
 * Página de espera para usuários com candidatura em análise
 */
router.get('/application-pending', async (req, res) => {
  if (!req.session.user) return res.redirect('/signin');
  try {
    const userDoc = await db.collection('users').doc(req.session.user.id).get();
    if (userDoc.exists) {
      const freshStatus = userDoc.data().status;
      req.session.user.status = freshStatus;
      if (freshStatus === 'approved') {
        return req.session.save(() => res.redirect('/admin/community-dashboard'));
      }
    }
  } catch (e) {
    console.error('Error refreshing user status:', e);
  }
  res.render('public/application-pending', {
    title: 'Application Under Review - PSF',
    currentPage: '',
    user: req.session.user
  });
});

/**
 * GET /signin
 * Página de login (todos os usuários)
 */
router.get('/signin', redirectIfAuthenticated, adminController.showLogin);

/**
 * POST /signin
 * Processa login (todos os usuários)
 */
router.post('/signin', checkLoginRateLimit, adminController.processLogin);

/**
 * GET /signup
 * Página de cadastro (community users)
 */
router.get('/signup', redirectIfAuthenticated, adminController.showSignup);

/**
 * POST /signup
 * Processa cadastro (community users)
 */
router.post('/signup', adminController.processSignup);

/**
 * GET /logout
 * Faz logout
 */
router.get('/logout', adminController.logout);

// ===============================
// PROBLEMAS PÚBLICOS
// ===============================

/**
 * GET /problems
 * Lista problemas aprovados publicamente
 */
router.get('/problems', problemController.getPublicProblems);

/**
 * GET /problems/:id
 * Exibe detalhes de problema aprovado
 */
router.get('/problems/:id', problemController.getPublicProblemDetail);

export default router;
