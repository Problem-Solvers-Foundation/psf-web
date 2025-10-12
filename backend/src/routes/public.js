/**
 * ROTAS PÚBLICAS
 * Páginas públicas renderizadas com EJS (Server-Side Rendering)
 */

import express from 'express';
import { db } from '../config/firebase.js';

const router = express.Router();

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
    const stats = {
      totalProjects: projects.length,
      totalLives: projects.reduce((sum, p) => sum + (p.metrics?.livesImpacted || 0), 0),
      totalVolunteers: projects.reduce((sum, p) => sum + (p.metrics?.volunteersInvolved || 0), 0)
    };

    // Renderizar página
    res.render('public/index', {
      layout: 'layouts/public',
      title: 'Problem Solver Foundation - Home',
      description: 'Impact 1 billion people by 2035',
      currentPage: 'home',
      stats: stats
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
    const stats = {
      totalProjects: projects.length,
      totalLives: projects.reduce((sum, p) => sum + (p.metrics?.livesImpacted || 0), 0),
      totalVolunteers: projects.reduce((sum, p) => sum + (p.metrics?.volunteersInvolved || 0), 0)
    };

    res.render('public/impact', {
      title: 'Our Impact - PSF',
      description: 'See the impact we\'re making',
      currentPage: 'impact',
      stats: stats
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
 * JOIN PAGE
 * GET /join
 */
router.get('/join', (req, res) => {
  res.render('public/join', {
    layout: 'layouts/public',
    title: 'Join Us - PSF',
    description: 'Become a volunteer',
    currentPage: 'join'
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

export default router;
