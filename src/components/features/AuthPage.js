import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContext from '../../store/AppContext';

/**
 * Página de autenticação — login e cadastro.
 * Utiliza o authService do AppContext para operações reais.
 */
const AuthPage = () => {
  const { authService, familyService, dispatch } = useContext(AppContext);
  const navigate = useNavigate();

  // Controles de formulário
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Campos do formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Submete o formulário de login ou cadastro.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!authService) {
      setError('Serviço de autenticação ainda não está pronto. Aguarde um momento.');
      return;
    }

    setLoading(true);

    try {
      let loggedUser;

      if (isRegister) {
        // Cadastro de novo usuário
        loggedUser = await authService.register({ name, email, password });
      } else {
        // Login com usuário existente
        loggedUser = await authService.login(email, password);
      }

      if (!loggedUser) {
        setError(isRegister ? 'Não foi possível criar a conta.' : 'E-mail ou senha incorretos.');
        return;
      }

      // Atualiza o estado global com o usuário autenticado
      dispatch({ type: 'SET_CURRENT_USER', payload: { ...loggedUser, password: undefined } });
      localStorage.setItem('currentUserId', loggedUser.id);

      // Carrega a primeira família do usuário se disponível
      if (familyService) {
        const families = await familyService.getFamiliesForUser(loggedUser.id);
        if (families.length > 0) {
          dispatch({ type: 'SET_CURRENT_FAMILY', payload: families[0] });
        }
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Erro de autenticação:', err);
      setError(err?.message ?? 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex min-h-screen">
        {/* Seção esquerda: visual evocativo */}
        <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-container">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container/80 to-primary-container/20" />
          </div>
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-lg lg:p-xl">
            <div className="flex items-center gap-base">
              <span className="material-symbols-outlined text-surface-container-low text-[32px]">account_tree</span>
              <h1 className="font-headline-sm text-headline-sm text-surface-container-low tracking-tight">Ancestry AI</h1>
            </div>
            <div className="max-w-md">
              <h2 className="font-display-lg text-display-lg text-white mb-md leading-tight">
                Preserve o legado que moldou quem você é hoje.
              </h2>
              <p className="font-body-lg text-body-lg text-surface-container-low opacity-90">
                Nossa tecnologia de IA de ponta mergulha em arquivos históricos para conectar você às suas raízes, garantindo que cada história seja contada com precisão e segurança absoluta.
              </p>
              <div className="mt-lg flex items-center gap-md">
                <div className="flex -space-x-sm">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-white">person</span>
                    </div>
                  ))}
                </div>
                <span className="text-white text-label-md font-label-md uppercase tracking-widest">
                  Junte-se a 20.000+ pesquisadores
                </span>
              </div>
            </div>
            <div className="flex gap-lg">
              <div className="flex items-center gap-xs text-white opacity-60 text-label-md">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Criptografia de Nível Bancário</span>
              </div>
              <div className="flex items-center gap-xs text-white opacity-60 text-label-md">
                <span className="material-symbols-outlined text-sm">history_edu</span>
                <span>Patrimônio Protegido</span>
              </div>
            </div>
          </div>
        </section>

        {/* Seção direita: formulário de autenticação */}
        <section className="w-full lg:w-1/2 bg-surface flex items-center justify-center p-md lg:p-gutter">
          <div className="w-full max-w-[420px]">
            {/* Logo mobile */}
            <div className="lg:hidden flex items-center gap-base mb-xl">
              <span className="material-symbols-outlined text-primary text-[28px]">account_tree</span>
              <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight">Ancestry AI</h1>
            </div>

            {/* Cabeçalho */}
            <div className="mb-xl">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                {isRegister ? 'Crie sua conta' : 'Bem-vindo de volta'}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {isRegister
                  ? 'Comece a construir sua história genealógica hoje.'
                  : 'Acesse sua linhagem e continue sua jornada de descoberta.'}
              </p>
            </div>

            {/* Botões sociais (visuais, sem integração OAuth nesta fase) */}
            <div className="grid grid-cols-2 gap-md mb-xl">
              <button
                type="button"
                className="flex items-center justify-center gap-sm px-md py-sm border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.32-2.06 4.44-1.16 1.12-2.88 2.04-5.78 2.04-4.8 0-8.74-3.88-8.74-8.68s3.94-8.68 8.74-8.68c2.6 0 4.54 1.02 5.94 2.34l2.32-2.32C18.66 1.26 15.82 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.74 0 6.58-1.22 8.78-3.52 2.26-2.26 2.96-5.46 2.96-8.02 0-.58-.06-1.12-.16-1.64h-11.58z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-sm px-md py-sm border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.96.95-2.04 1.43-3.24 1.43-1.18 0-2.1-.38-2.76-.38-.66 0-1.74.42-2.8.42-1.4 0-2.6-.74-3.58-2.18-1.92-2.86-1.92-7.36.14-10.4 1-1.52 2.6-2.48 4.34-2.48 1.34 0 2.4.42 3.2.42.8 0 2.18-.54 3.7-.54 1.58 0 2.94.8 3.76 1.94-3.16 1.5-2.66 5.86.54 7.22-.64 1.62-1.54 3.24-2.54 4.51zM14.94 4.42c-.78.94-1.84 1.5-2.92 1.42.14-1.06.66-2.14 1.44-3.08.78-.92 1.9-1.5 2.96-1.5.1 1.1-.48 2.22-1.48 3.16z" />
                </svg>
                Apple
              </button>
            </div>

            {/* Divisor */}
            <div className="relative mb-xl text-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-outline-variant" />
              </div>
              <span className="relative px-md bg-surface text-label-md text-on-surface-variant uppercase tracking-wider">
                Ou acesse com e-mail
              </span>
            </div>

            {/* Mensagem de erro inline */}
            {error && (
              <div className="mb-md px-md py-sm bg-error-container border border-error/30 rounded-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-error text-[18px]" aria-hidden="true">error</span>
                <p className="text-body-md text-error">{error}</p>
              </div>
            )}

            {/* Formulário */}
            <form className="space-y-lg" onSubmit={handleSubmit}>
              {/* Campo nome — somente no cadastro */}
              {isRegister && (
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-xs" htmlFor="name">
                    Nome completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-fixed focus:border-primary transition-all duration-200 placeholder:text-outline-variant font-body-md"
                  />
                </div>
              )}

              {/* E-mail */}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-xs" htmlFor="email">
                  Endereço de E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-fixed focus:border-primary transition-all duration-200 placeholder:text-outline-variant font-body-md"
                />
              </div>

              {/* Senha */}
              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                    Senha
                  </label>
                  {!isRegister && (
                    <a className="text-label-md font-label-md text-primary hover:underline transition-all" href="/forgot-password">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-fixed focus:border-primary transition-all duration-200 placeholder:text-outline-variant font-body-md"
                  />
                  <button
                    type="button"
                    className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Manter conectado — somente no login */}
              {!isRegister && (
                <div className="flex items-start gap-sm py-sm">
                  <input
                    id="remember"
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary"
                  />
                  <label className="text-body-md text-on-surface-variant leading-tight" htmlFor="remember">
                    Mantenha-me conectado para acesso rápido aos meus registros.
                  </label>
                </div>
              )}

              {/* Botão de submissão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-title-lg text-title-lg py-md rounded-lg shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{isRegister ? 'Criando conta…' : 'Entrando…'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Criar conta' : 'Entrar no Arquivo'}</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Alternância login / cadastro */}
            <div className="mt-xl text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                {isRegister ? 'Já tem uma conta? ' : 'Ainda não faz parte da nossa história? '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(null); }}
                  className="text-primary font-semibold hover:underline"
                >
                  {isRegister ? 'Faça login' : 'Crie sua conta'}
                </button>
              </p>
            </div>

            {/* Rodapé de conformidade */}
            <div className="mt-xl pt-lg border-t border-outline-variant flex flex-col items-center gap-md opacity-60">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary">verified</span>
                <span className="text-label-md font-label-md uppercase tracking-tighter">
                  Conformidade GDPR &amp; Proteção de Dados
                </span>
              </div>
              <p className="text-[11px] text-center max-w-[280px] text-on-surface-variant">
                Seus dados genéticos e históricos são criptografados e nunca são compartilhados sem seu consentimento explícito.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
