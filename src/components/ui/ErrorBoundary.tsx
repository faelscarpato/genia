import React, { Component, ErrorInfo } from 'react';

// ============================================================
// TIPOS
// ============================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================
// COMPONENTE (Class Component — necessário para Error Boundaries)
// ============================================================

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700">
          <h2 className="text-xl font-bold mb-4">Algo deu errado</h2>
          <p className="mb-4">
            Desculpe, ocorreu um erro inesperado. Por favor, tente recarregar a página.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-red-100 rounded">
              <h3 className="font-bold mb-2">Detalhes do erro:</h3>
              <pre className="text-sm overflow-auto">
                {this.state.error?.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre className="text-xs mt-2 opacity-70">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-secondary text-on-secondary rounded hover:bg-secondary/90 transition"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
