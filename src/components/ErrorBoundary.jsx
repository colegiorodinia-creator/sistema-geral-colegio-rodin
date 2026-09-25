import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('rodin_current_user');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#1E293B] p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-[#FFF1EB] text-[#F45206] rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl">
              !
            </div>
            <h1 className="text-xl font-black text-[#1E293B] mb-2">Ops! Ocorreu um problema inesperado</h1>
            <p className="text-sm text-[#64748B] mb-6">
              Houve uma instabilidade temporária na inicialização da interface. Clique abaixo para reiniciar a sessão com segurança.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-[#F1F5F9] text-[#475569] p-3 rounded-xl mb-6 text-left overflow-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 bg-[#F45206] hover:bg-[#D94400] text-white font-bold rounded-xl transition shadow-lg shadow-[#F45206]/20"
            >
              Reiniciar e Atualizar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
