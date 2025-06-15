
import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n';

createRoot(document.getElementById("root")!).render(
    <React.Suspense fallback={<div>Loading...</div>}>
        <App />
    </React.Suspense>
);
