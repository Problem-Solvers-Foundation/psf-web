---
sidebar_position: 3
---

# Configuration

Learn how to configure your Problem Solver Foundation application.

## Project Structure

```
psf-web/
├── backend/                    # Node.js Express backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   ├── views/            # EJS templates
│   │   └── server.js         # Main server file
│   ├── .env                  # Environment variables (gitignored)
│   ├── .env.example          # Environment template
│   ├── package.json
│   └── serviceAccountKey.json # Firebase credentials (gitignored)
│
├── frontend/                  # Static frontend assets
│   └── assets/
│       ├── css/              # Stylesheets
│       ├── js/               # Client scripts
│       └── images/           # Images, icons
│
├── docs-site/                # Docusaurus documentation
├── .gitignore
├── package.json              # Root package.json
├── render.yaml               # Render.com configuration
└── vercel.json               # Vercel configuration
```

## Backend Configuration

### Firebase

The backend uses Firebase Admin SDK for database operations.

**File:** `backend/src/config/firebase.js`

The Firebase configuration supports 3 modes:

1. **Production (Individual Variables)** - Recommended for Vercel/Render
2. **Production (JSON)** - Alternative method
3. **Development (File)** - Uses `serviceAccountKey.json`

### Session Management

**File:** `backend/src/server.js`

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### CORS Configuration

```javascript
const allowedOrigins = [
  'https://psf-backend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

## Frontend Configuration

### API Configuration

**File:** `frontend/assets/js/config.js`

```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};
```

For production, update `baseURL` to your deployed API URL.

## Environment-Specific Settings

### Development

```bash
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Production (Render)

```bash
NODE_ENV=production
PORT=10000  # Render uses port 10000
```

### Production (Vercel)

```bash
NODE_ENV=production
PORT=3000
VERCEL=1  # Automatically set by Vercel
```

## Database Configuration

Firebase Firestore collections:

- **`projects`** - Social impact projects
- **`posts`** - Blog posts
- **`applications`** - Team applications
- **`users`** - Admin users

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for projects and posts
    match /projects/{project} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /posts/{post} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null;
    }

    // Private collections
    match /applications/{application} {
      allow read, write: if request.auth != null;
    }

    match /users/{user} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

- [Deployment Guide](./deployment.md)
- [Environment Variables Reference](./environment-variables.md)
- [Security Best Practices](./security.md)
