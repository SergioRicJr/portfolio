# Sergio Nascimento Jr - Portfolio

Modern, sophisticated portfolio website built with React, Tailwind CSS, and Framer Motion.

## Technologies

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **3D**: React Three Fiber (Three.js)
- **Icons**: Lucide React

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

## Build

To create a production build (suitable for S3 deployment):

```bash
npm run build
```

The output will be in the `dist` directory.

## Deployment

This project is designed as a Single Page Application (SPA). When deploying to AWS S3:

1. Upload the contents of `dist` to your bucket.
2. Enable Static Website Hosting.
3. Set `index.html` as both the Index document and Error document.
