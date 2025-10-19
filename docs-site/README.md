# PSF Documentation Site

This directory contains the Docusaurus documentation site for Problem Solver Foundation.

## Development

```bash
cd docs-site
npm install
npm start
```

Visit http://localhost:3000

## Build

```bash
npm run build
```

The static site will be generated in the `build/` directory.

## Deploy

The documentation is automatically deployed to Vercel when changes are pushed to the main branch.

## Adding Documentation

1. Create a new `.md` file in `docs/`
2. Add frontmatter with `sidebar_position`
3. Update `sidebars.ts` if needed
4. Commit and push

## Tech Stack

- Docusaurus 3.x
- React 18
- TypeScript
- MDX
