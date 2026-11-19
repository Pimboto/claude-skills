import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import '@fontsource-variable/mona-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import 'lenis/dist/lenis.css';
import './styles.css';

// the built page arrives already rendered (tools/prerender.mjs); in development it is drawn from scratch
const root = document.getElementById('root');
const app = <React.StrictMode><App /></React.StrictMode>;
if (root.dataset.prerendered) hydrateRoot(root, app);
else createRoot(root).render(app);
