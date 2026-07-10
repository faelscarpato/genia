import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[921px] flex items-center overflow-hidden hero-gradient pt-16">
        <div className="container-max mx-auto px-lg relative z-10 grid lg:grid-cols-2 gap-xl items-center">
          <div className="max-w-2xl space-y-md">
            <div className="inline-flex items-center gap-xs px-sm py-xs bg-surface-container-high rounded-full border border-outline-variant">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Inteligência Artificial de Elite</span>
            </div>
            <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">
              Desvende sua herança com a <span className="text-secondary">precisão da IA</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              A plataforma definitiva para genealogia avançada, pesquisa documental e descoberta de antepassados com evidências reais.
            </p>
            <div className="flex flex-wrap gap-md pt-sm">
              <Link to="/auth" className="bg-primary text-on-primary px-xl py-md rounded-lg font-title-lg text-title-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-sm">
                Começar minha Árvore
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <button className="border border-outline text-on-surface px-xl py-md rounded-lg font-title-lg text-title-lg hover:bg-surface-container transition-all">
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-xl bg-surface-container-low" id="features">
        <div className="container-max mx-auto px-lg">
          <div className="text-center max-w-3xl mx-auto mb-xl">
            <h2 className="font-headline-md text-headline-md mb-md">Tecnologia a serviço da sua história</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Unimos arquivos históricos globais e algoritmos proprietários para preencher as lacunas do seu passado.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg auto-rows-[280px]">
            {/* Feature 1 */}
            <div className="md:col-span-8 bg-surface border border-outline-variant rounded-xl p-lg bento-card flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-secondary mb-md block" style={{ fontSize: '32px' }}>account_tree</span>
                <h3 className="font-headline-sm text-headline-sm mb-sm">Árvore Genealógica Interativa</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Visualize séculos de história em segundos com nosso visualizador fluido de pan e zoom infinito.</p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="md:col-span-4 bg-primary-container text-on-primary rounded-xl p-lg bento-card flex flex-col justify-end relative overflow-hidden">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-secondary-fixed mb-md block" style={{ fontSize: '32px' }}>history_edu</span>
                <h3 className="font-title-lg text-title-lg mb-sm">Pesquisa Documental Assistida</h3>
                <p className="font-body-md text-body-md text-on-primary-fixed-variant">IA que escaneia e transcreve registros históricos em tempo real.</p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="md:col-span-4 bg-surface border border-outline-variant rounded-xl p-lg bento-card flex flex-col items-center text-center justify-center space-y-md">
              <div className="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>verified_user</span>
              </div>
              <h3 className="font-title-lg text-title-lg">Sistema de Confiança</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Validação rigorosa de relacionamentos baseada em evidências cruzadas.</p>
            </div>
            {/* Feature 4 */}
            <div className="md:col-span-8 bg-surface-container-highest border border-outline-variant rounded-xl p-lg bento-card flex flex-col md:flex-row gap-lg items-center">
              <div className="flex-1 space-y-sm">
                <span className="material-symbols-outlined text-secondary block" style={{ fontSize: '32px' }}>groups</span>
                <h3 className="font-headline-sm text-headline-sm">Colaboração Segura</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Construa sua história com familiares em um ambiente privado e criptografado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-xl bg-surface" id="trust">
        <div className="container-max mx-auto px-lg">
          <div className="grid lg:grid-cols-2 gap-xl items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl relative border border-outline-variant">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '96px' }}>security</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex items-end p-lg">
                  <p className="text-on-primary font-body-lg italic">&quot;Preserve sua memória para as próximas gerações com a segurança que elas merecem.&quot;</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-lg">
              <h2 className="font-headline-md text-headline-md">Sua história é privada e sagrada</h2>
              <div className="space-y-md">
                {[
                  { icon: 'privacy_tip', title: 'Conformidade LGPD', desc: 'Cumprimos os mais altos padrões de proteção de dados pessoais e privacidade.' },
                  { icon: 'encrypted', title: 'Criptografia de Ponta', desc: 'Seus documentos e árvores são protegidos por criptografia de nível bancário.' },
                  { icon: 'cloud_done', title: 'Propriedade de Dados', desc: 'Você é o único dono das suas descobertas. Exporte tudo quando quiser.' },
                ].map(({ icon, title, desc }) => (
                  <div key={icon} className="flex gap-md">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <div>
                      <h4 className="font-title-lg text-title-lg mb-xs">{title}</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-xl bg-primary-container relative overflow-hidden">
        <div className="container-max mx-auto px-lg relative z-10 text-center py-lg">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-md text-on-surface">Pronto para encontrar suas raízes?</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-xl">
            Junte-se a milhares de pesquisadores que estão redefinindo a genealogia com o poder da inteligência artificial.
          </p>
          <Link to="/auth" className="inline-flex items-center gap-md bg-secondary text-on-primary px-xl py-lg rounded-lg font-headline-sm text-headline-sm hover:bg-secondary/90 hover:scale-105 transition-all shadow-xl">
            Começar Gratuitamente
            <span className="material-symbols-outlined">rocket_launch</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
