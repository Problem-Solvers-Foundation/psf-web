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

    // Construir query
    let query = postsCollection.where('isPublished', '==', true);

    // Filtrar por categoria se fornecida
    if (category) {
      query = query.where('category', '==', category);
    }

    // Buscar posts
    const snapshot = await query.get();

    // Formatar posts
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Filtrar por tag (client-side, já que Firestore não suporta array-contains + outras queries)
    if (tag && posts.length > 0) {
      posts = posts.filter(post =>
        post.tags && post.tags.includes(tag)
      );
    }

    // Ordenar por data (mais recente primeiro)
    posts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Renderizar template EJS com layout
    res.render('layouts/main', {
      title: 'Blog - Problem Solver Foundation',
      description: 'Insights, stories, and updates from the Problem Solver Foundation',
      body: await renderTemplate('blog/list', { posts })
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
      return res.status(404).send(`
        <html>
          <head>
            <title>Post Not Found</title>
            <style>
              body { font-family: Arial; padding: 50px; text-align: center; }
              h1 { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1>404 - Post Not Found</h1>
            <p>The blog post you're looking for doesn't exist.</p>
            <a href="/blog">← Back to blog</a>
          </body>
        </html>
      `);
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

    // Renderizar template
    res.render('layouts/main', {
      title: `${post.title} - Blog PSF`,
      description: post.excerpt || post.title,
      body: await renderTemplate('blog/post', { post })
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