import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Punto de entrada principal de la aplicación que inicializa el árbol de componentes en el DOM.
// Configura React.StrictMode, carga los estilos globales de TailwindCSS y monta el componente App.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
