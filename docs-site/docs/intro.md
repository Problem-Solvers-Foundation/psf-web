---
sidebar_position: 1
---

# Welcome to PSF Documentation

**Problem Solver Foundation** - Impact 1 billion people by 2035 (1B2035)

Complete web system for social project management with administrative dashboard, blog, applications system, and authentication.

## 🎯 Overview

Full-stack **unified** web application for managing social impact projects, blog posts, team applications, and administrative tasks. Built with Node.js/Express backend, EJS templating, and Firebase Firestore database.

**Architecture:** This is a **monolithic fullstack application** where the Express backend serves both the API and the frontend HTML pages using Server-Side Rendering (EJS). The backend and frontend run together on a single server.

## Key Features

- 📊 **Projects Dashboard** - Track social impact projects with metrics
- 📝 **Blog System** - Multi-category blog with draft/publish workflow
- 📋 **Applications System** - Multi-step application forms with admin review
- 🔐 **Authentication** - Secure admin panel with session management
- 📱 **Responsive Design** - Mobile-first with Tailwind CSS
- 🚀 **Server-Side Rendering** - Fast page loads with EJS templates

## Quick Links

- [Installation Guide](./installation.md)
- [Deployment Guide](./deployment.md)
- [Security Best Practices](./security.md)
- [Environment Variables](./environment-variables.md)

## Live URLs

**Primary (Render):**
- Full Application: https://psf-backend.onrender.com
- Admin Panel: https://psf-backend.onrender.com/admin
- Blog: https://psf-backend.onrender.com/blog

**Backup/Alternative (Vercel):**
- Full Application: https://problemsolverfoundation.vercel.app

> **Note:** Both Render and Vercel host the **entire application** (backend + frontend). They serve as redundant deployments - you can use either URL to access the complete site.
