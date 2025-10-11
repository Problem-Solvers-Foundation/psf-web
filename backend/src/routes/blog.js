/**
 * ROTAS DO BLOG
 * SSR (Server-Side Rendering) com EJS + API REST
 */

import express from 'express';
const router = express.Router();
import * as blogController from '../controllers/blogController.js';
import { db } from '../config/firebase.js';

// ===============================
// ROTAS SSR (Server-Side Rendering)
// Renderiza HTML completo no servidor
// ===============================

/**
 * GET /blog
 * Lista de posts do blog (HTML renderizado)
 * Query params: ?category=tech&tag=innovation
 */
router.get('/', blogController.renderBlogList);

/**
 * GET /blog/:slug
 * Post individual (HTML renderizado)
 * Exemplo: /blog/my-first-post
 */
router.get('/:slug', blogController.renderBlogPost);

// ===============================
// ROTAS API (JSON)
// Para uso no frontend client-side
// ===============================

/**
 * GET /api/blog/posts
 * Retorna lista de posts em JSON
 */
router.get('/api/posts', async (req, res) => {
  try {
    const postsCollection = db.collection('posts');

    const snapshot = await postsCollection
      .where('isPublished', '==', true)
      .get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Ordenar
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: posts.length,
      data: posts
    });

  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar posts',
      message: error.message
    });
  }
});

/**
 * GET /api/blog/posts/:id
 * Retorna post específico em JSON
 */
router.get('/api/posts/:id', async (req, res) => {
  try {
    const postsCollection = db.collection('posts');

    const doc = await postsCollection.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Post não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar post',
      message: error.message
    });
  }
});

export default router;