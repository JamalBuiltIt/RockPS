import { Buffer } from 'buffer';
import process from 'process/browser';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ✅ Import BrowserRouter
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Properly patch globals
window.global = window;
window.process = process;
window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Wrap App in BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
