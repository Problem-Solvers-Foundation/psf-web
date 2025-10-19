---
sidebar_position: 8
---

# Tech Stack

Complete list of technologies used in the Problem Solver Foundation project.

## Backend

### Core Framework
- **Node.js 22.x** - JavaScript runtime
- **Express.js 4.x** - Web application framework
- **ES Modules** - Modern JavaScript module system

### Database & Storage
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Admin SDK 12.x** - Server-side Firebase integration
- **Google Cloud** - Infrastructure (via Firebase)

### Template Engine
- **EJS 3.x** - Embedded JavaScript templating
- **express-ejs-layouts 2.x** - Layout support for EJS

### Authentication & Security
- **express-session 1.x** - Session middleware
- **bcryptjs 2.x** - Password hashing
- **jsonwebtoken 9.x** - JWT token generation
- **express-validator 7.x** - Input validation and sanitization

### Middleware
- **CORS 2.x** - Cross-Origin Resource Sharing
- **dotenv 16.x** - Environment variables management
- **Custom middleware** - Authentication, error handling

## Frontend

### Core Technologies
- **HTML5** - Semantic markup
- **CSS3** - Modern styling
- **Vanilla JavaScript** - No framework, pure JS
- **ES6+** - Modern JavaScript features

### Styling Framework
- **Tailwind CSS 3.x** - Utility-first CSS framework
- Custom CSS - Additional styling

### Client-Side Features
- **Fetch API** - HTTP requests to backend API
- **DOM Manipulation** - Dynamic content updates
- **Form Validation** - Client-side validation
- **Responsive Design** - Mobile-first approach

### Assets
- **Custom JavaScript Modules** - `config.js`, `utils.js`
- **Images** - Optimized assets
- **Icons** - SVG and font icons

## Documentation

### Docusaurus
- **Docusaurus 3.x** - Documentation site generator
- **React 18.x** - UI library (Docusaurus dependency)
- **MDX** - Markdown with JSX
- **TypeScript** - Type safety for configuration

## DevOps & Deployment

### Hosting Platforms
- **Render.com** - Primary hosting (full application)
  - Free tier
  - Supports private repositories
  - Auto-deploy from Git

- **Vercel** - Backup/alternative hosting
  - Serverless functions
  - Requires public repository (free tier)
  - Edge network (CDN)

### CI/CD
- **Git** - Version control
- **GitHub** - Repository hosting
- **Automatic Deployments** - Push to main triggers deploy

### Configuration Files
- `package.json` - Node.js dependencies
- `vercel.json` - Vercel configuration
- `render.yaml` - Render.com configuration
- `.env` - Environment variables (gitignored)
- `.env.example` - Environment template

## Development Tools

### Package Managers
- **npm** - Node Package Manager

### Code Quality
- **ESLint** (optional) - Code linting
- **Prettier** (optional) - Code formatting

### Version Control
- **Git** - Source control
- **GitHub** - Remote repository
- **.gitignore** - Exclude sensitive files

## Testing

### Current Setup
- Manual testing
- Browser testing (Chrome, Firefox, Safari)

### Future Improvements
- **Jest** - Unit testing
- **Supertest** - API testing
- **Cypress** - E2E testing

## Browser Support

### Modern Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile Browsers
- ✅ iOS Safari 14+
- ✅ Chrome Mobile
- ✅ Samsung Internet

## Node.js Modules

### Production Dependencies
```json
{
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "ejs": "^3.1.10",
  "express": "^4.21.2",
  "express-ejs-layouts": "^2.5.1",
  "express-session": "^1.18.2",
  "express-validator": "^7.2.1",
  "firebase-admin": "^12.7.0",
  "firebase-functions": "^4.5.0",
  "jsonwebtoken": "^9.0.2"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.1.10"
}
```

## Performance

### Optimization Techniques
- **Server-Side Rendering** - Fast initial page load
- **CDN** - Static assets served from edge locations (Vercel)
- **Gzip Compression** - Reduced transfer size
- **Minification** - CSS and JS minified in production
- **Image Optimization** - Compressed images

### Monitoring
- **Render Logs** - Application logs
- **Vercel Analytics** - Performance metrics
- **Firebase Console** - Database monitoring

## Security Stack

### Security Measures
- **HTTPS** - TLS encryption
- **Environment Variables** - Secrets management
- **Password Hashing** - bcryptjs with salt
- **Session Security** - HttpOnly, Secure cookies
- **Input Validation** - express-validator
- **CORS Configuration** - Allowed origins only
- **SQL Injection Prevention** - N/A (NoSQL Firestore)
- **XSS Prevention** - EJS auto-escaping

## Architecture Style

### Monolithic Fullstack
- **Single Codebase** - Backend and frontend together
- **Server-Side Rendering** - EJS templates
- **RESTful API** - JSON endpoints for AJAX
- **Session-Based Auth** - Traditional server sessions

### Why This Stack?

**Advantages:**
- ✅ Simple deployment (one app)
- ✅ No CORS issues (same origin)
- ✅ Better SEO (SSR)
- ✅ Cost-effective (free tiers)
- ✅ Easy to understand and maintain
- ✅ Firebase handles scaling

**Trade-offs:**
- ⚠️ Less flexible than microservices
- ⚠️ Frontend and backend coupled
- ⚠️ Requires server for all pages

## Version Requirements

| Technology | Minimum Version | Recommended |
|-----------|----------------|-------------|
| Node.js | 20.0 | 22.x |
| npm | 9.0 | 10.x |
| Firebase | N/A | Latest |
| Modern Browser | ES6 support | Latest |

## Next Steps

- [Architecture Overview](./architecture.md)
- [Installation Guide](./installation.md)
- [Configuration Guide](./configuration.md)
