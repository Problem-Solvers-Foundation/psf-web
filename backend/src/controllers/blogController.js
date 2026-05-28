/**
 * CONTROLLER DO BLOG (SSR)
 * Lógica para renderizar páginas do blog no servidor
 */
import { db } from '../config/firebase.js';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const postsCollection = db.collection('posts');

/**
 * Renderiza a página com lista de posts do blog
 * GET /blog
 */
export const renderBlogList = async (req, res) => {
  try {
    const { category, tag } = req.query;

    // Buscar todos os posts publicados
    const snapshot = await postsCollection.where('isPublished', '==', true).get();

    let allPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Extrair categorias únicas para os filtros
    const categories = [...new Set(allPosts.map(p => p.category).filter(Boolean))].sort();

    // Filtrar por categoria
    let posts = category ? allPosts.filter(p => p.category === category) : allPosts;

    // Filtrar por tag
    if (tag) {
      posts = posts.filter(p => p.tags && p.tags.includes(tag));
    }

    // Ordenar por data (mais recente primeiro)
    posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Renderizar template EJS com layout
    res.render('layouts/main', {
      title: 'Blog - Problem Solver Foundation',
      description: 'Insights, stories, and updates from the Problem Solver Foundation',
      body: await renderTemplate('blog/list', { posts, categories, currentCategory: category || null, currentTag: tag || null })
    });

  } catch (error) {
    console.error('Erro ao carregar lista de posts:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial; padding: 50px; text-align: center; }
            h1 { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1>500 - Server Error</h1>
          <p>Error loading blog posts. Please try again later.</p>
          <a href="/blog">← Back to blog</a>
        </body>
      </html>
    `);
  }
};

/**
 * Renderiza página de post individual
 * GET /blog/:slug
 */
export const renderBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;

    // Buscar post pelo slug
    const snapshot = await postsCollection
      .where('slug', '==', slug)
      .where('isPublished', '==', true)
      .limit(1)
      .get();

    // Verificar se post existe
    if (snapshot.empty) {
      return res.status(404).render('errors/404');
    }

    const doc = snapshot.docs[0];
    const post = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    };

    // Calcular tempo de leitura (estimativa: 200 palavras por minuto)
    if (post.content && !post.readingTime) {
      const wordCount = post.content.split(/\s+/).length;
      post.readingTime = Math.ceil(wordCount / 200);
    }

    // Buscar posts relacionados
    let relatedPosts = [];
    try {
      if (post.category) {
        const relatedSnap = await postsCollection
          .where('isPublished', '==', true)
          .where('category', '==', post.category)
          .get();
        relatedPosts = relatedSnap.docs
          .filter(d => d.id !== doc.id)
          .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
      }
      if (relatedPosts.length < 3) {
        const otherSnap = await postsCollection.where('isPublished', '==', true).get();
        const existingIds = new Set([doc.id, ...relatedPosts.map(p => p.id)]);
        const others = otherSnap.docs
          .filter(d => !existingIds.has(d.id))
          .map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3 - relatedPosts.length);
        relatedPosts = [...relatedPosts, ...others];
      }
    } catch (e) {
      console.error('Error fetching related posts:', e);
    }

    const pageUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Renderizar template
    res.render('layouts/main', {
      title: `${post.title} - Blog PSF`,
      description: post.excerpt || post.title,
      ogImage: post.imageUrl || null,
      ogUrl: pageUrl,
      ogType: 'article',
      body: await renderTemplate('blog/post', { post, relatedPosts })
    });

  } catch (error) {
    console.error('Erro ao carregar post:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial; padding: 50px; text-align: center; }
            h1 { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1>500 - Server Error</h1>
          <p>Error loading blog post. Please try again later.</p>
          <a href="/blog">← Back to blog</a>
        </body>
      </html>
    `);
  }
};

/**
 * Função auxiliar para renderizar templates EJS
 * @param {string} viewPath - Caminho do template
 * @param {object} data - Dados para o template
 * @returns {Promise<string>} - HTML renderizado
 */
async function renderTemplate(viewPath, data) {
  return new Promise((resolve, reject) => {
    const templatePath = path.join(__dirname, '../views', `${viewPath}.ejs`);

    fs.readFile(templatePath, 'utf8', (err, template) => {
      if (err) return reject(err);

      try {
        const html = ejs.render(template, data);
        resolve(html);
      } catch (renderError) {
        reject(renderError);
      }
    });
  });
}