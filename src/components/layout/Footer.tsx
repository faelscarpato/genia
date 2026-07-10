import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest py-xl border-t border-outline-variant">
      <div className="container-max mx-auto px-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-xl">
          {/* Marca */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '24px' }}>account_tree</span>
              <span className="font-headline-sm text-headline-sm text-primary">Ancestry AI</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Digital Archive Excellence. Transformando o passado em legado digital através da tecnologia.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h5 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-md">Plataforma</h5>
            <ul className="space-y-sm">
              <li><Link to="/family/1" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary">Árvore Genealógica</Link></li>
              <li><Link to="/search" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary">Pesquisa Global</Link></li>
              <li><a href="/api-docs" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary">API para Historiadores</a></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h5 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-md">Empresa</h5>
            <ul className="space-y-sm">
              <li><a href="/about" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary">Sobre Nós</a></li>
              <li><a href="/privacy" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary">Privacidade</a></li>
              <li><a href="/terms" className="font-body-md text-body-md text-on-surface-variant hover:text-secondary">Termos de Uso</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h5 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-md">Newsletter</h5>
            <p className="font-body-md text-body-md text-on-surface-variant mb-md">Receba dicas de pesquisa e novidades.</p>
            <div className="flex gap-xs">
              <input
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-label-md font-label-md"
                placeholder="Seu e-mail"
                type="email"
                aria-label="Seu e-mail para newsletter"
              />
              <button
                className="bg-primary text-on-primary p-sm rounded-lg hover:bg-primary/90"
                aria-label="Assinar newsletter"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-lg border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-md">
          <p className="font-label-md text-label-md text-on-surface-variant">
            &copy; 2024 Ancestry AI. Todos os direitos reservados.
          </p>
          <div className="flex gap-lg">
            <button className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-secondary bg-transparent border-none" aria-label="Website">public</button>
            <button className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-secondary bg-transparent border-none" aria-label="Email">mail</button>
            <button className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-secondary bg-transparent border-none" aria-label="Share">share</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
