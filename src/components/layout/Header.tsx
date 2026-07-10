import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant h-16">
      <nav className="max-w-container-max mx-auto px-lg flex justify-between items-center h-full">
        {/* Logo */}
        <div className="flex items-center gap-sm">
          <span
            className="material-symbols-outlined text-secondary"
            style={{ fontSize: '32px' }}
          >
            account_tree
          </span>
          <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
            Ancestry AI
          </span>
        </div>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-lg">
          <a
            href="#features"
            className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors"
          >
            Funcionalidades
          </a>
          <a
            href="#trust"
            className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors"
          >
            Segurança
          </a>
          <Link
            to="/auth"
            className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-all"
          >
            Começar Agora
          </Link>
        </div>

        {/* Menu mobile */}
        <button className="md:hidden text-on-surface" aria-label="Abrir menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </nav>
    </header>
  );
};

export default Header;
