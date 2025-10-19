---
sidebar_position: 7
---

# Architecture

Understanding the Problem Solver Foundation application architecture.

## Overview

PSF is a **monolithic fullstack application** with a unified architecture where the Express backend serves both API endpoints and rendered HTML pages.

```
┌─────────────────────────────────────────────────┐
│                    Client                        │
│            (Browser / Mobile)                    │
└───────────────────┬─────────────────────────────┘
                    │
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────┐
│              Express Server                      │
│  ┌──────────────────────────────────────────┐  │
│  │         Routes Layer                      │  │
│  │  • Public Routes (SSR)                   │  │
│  │  • API Routes (JSON)                     │  │
│  │  • Admin Routes (Protected)              │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │      Controllers Layer                    │  │
│  │  • Business Logic                        │  │
│  │  • Data Validation                       │  │
│  │  • Authentication                        │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │       View Engine (EJS)                   │  │
│  │  • Template Rendering                    │  │
│  │  • Server-Side Rendering                 │  │
│  └──────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────┘
                    │
                    │ Firebase Admin SDK
                    ▼
┌─────────────────────────────────────────────────┐
│         Firebase Firestore                       │
│  • Projects Collection                           │
│  • Posts Collection                             │
│  • Applications Collection                       │
│  • Users Collection                             │
└─────────────────────────────────────────────────┘
```

## Application Flow

### 1. Server-Side Rendering (SSR) Flow

```
User Request → Express Router → Controller →
  → Fetch Data from Firestore →
  → Render EJS Template →
  → Send HTML to Client
```

**Example:** Homepage (`/`)
1. User visits homepage
2. Express routes to `publicRoutes`
3. Controller fetches projects from Firestore
4. EJS renders `views/public/index.ejs` with data
5. HTML sent to browser

### 2. API Flow (JSON)

```
API Request → Express Router → Controller →
  → Fetch/Update Data in Firestore →
  → Send JSON Response
```

**Example:** Get Projects API (`/api/projects`)
1. Client makes GET request
2. Express routes to API endpoint
3. Controller fetches from Firestore
4. JSON response sent back

### 3. Authentication Flow

```
Login Request → Auth Controller →
  → Validate Credentials →
  → Create Session →
  → Redirect to Dashboard
```

**Protected routes** use middleware:
```javascript
router.get('/admin', requireAuth, adminController.dashboard);
```

## Deployment Architecture

### Hosting Options

The application can be deployed to multiple platforms simultaneously:

```
┌──────────────┐       ┌──────────────┐
│    Render    │       │   Vercel     │
│  (Primary)   │       │  (Backup)    │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │  Both host the       │
       │  FULL APPLICATION    │
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
          ┌──────────────┐
          │   Firebase   │
          │  Firestore   │
          └──────────────┘
```

**Benefits:**
- 🔄 Redundancy - if one platform is down, the other works
- 🌍 Multiple URLs for different purposes
- 🧪 Separate environments (production vs staging)

### Serverless Adaptation (Vercel)

For Vercel serverless:

```
api/index.js → imports backend/src/server.js →
  → Exports Express app as serverless function
```

The server checks for `process.env.VERCEL` and skips `app.listen()` in serverless mode.

## Data Model

### Firebase Collections

#### Projects
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,
  status: 'active' | 'completed' | 'planning',
  metrics: {
    peopleImpacted: number,
    volunteers: number,
    startDate: timestamp
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Posts (Blog)
```javascript
{
  id: string,
  title: string,
  content: string,
  excerpt: string,
  author: string,
  category: string,
  status: 'draft' | 'published',
  publishedAt: timestamp,
  createdAt: timestamp
}
```

#### Applications
```javascript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  position: string,
  motivation: string,
  status: 'pending' | 'reviewed' | 'approved' | 'rejected',
  submittedAt: timestamp
}
```

#### Users (Admin)
```javascript
{
  id: string,
  username: string,
  password: string (hashed with bcrypt),
  email: string,
  role: 'admin' | 'editor',
  createdAt: timestamp
}
```

## Security Architecture

### Layers of Security

1. **HTTPS** - All traffic encrypted
2. **Authentication** - Session-based auth with express-session
3. **Authorization** - Middleware checks for protected routes
4. **Input Validation** - express-validator on all inputs
5. **Password Hashing** - bcryptjs with salt rounds
6. **CORS** - Configured allowed origins
7. **Environment Variables** - Secrets never in code

### Session Management

```javascript
express-session → MemoryStore (dev) → Session Cookie →
  → HttpOnly + Secure flags → 24-hour expiration
```

**Note:** In production with Vercel (serverless), consider using a database-backed session store like Redis or Firebase for persistence across function invocations.

## Performance Considerations

### Server-Side Rendering

**Pros:**
- ✅ Fast initial page load
- ✅ Better SEO
- ✅ Works without JavaScript

**Cons:**
- ⚠️ Server does more work
- ⚠️ Page reloads on navigation

### Caching Strategy

- Static assets (CSS, JS, images) cached by CDN
- EJS templates rendered on each request (dynamic content)
- Firebase queries optimized with indexes

## Scalability

### Current Setup
- Single server instance
- Firebase auto-scales database
- Suitable for small to medium traffic

### Future Improvements
- Add Redis for session storage
- Implement caching layer (Redis/Memcached)
- Load balancer for multiple instances
- CDN for static assets
- API rate limiting

## Next Steps

- [Tech Stack Details](./tech-stack.md)
- [Deployment Guide](./deployment.md)
- [Security Best Practices](./security.md)
