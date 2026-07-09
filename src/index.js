import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './store/AppContext';
import { SidebarProvider } from './contexts/SidebarContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </AppProvider>
  </React.StrictMode>
);

reportWebVitals();