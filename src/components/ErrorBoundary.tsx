import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Er is iets misgegaan in de app.</h1>
            <p className="text-black/60 mb-6">
              Sorry, er is een technische fout opgetreden. Hier is de foutmelding (stuur dit naar de ontwikkelaar):
            </p>
            <div className="bg-black/5 p-4 rounded-xl overflow-auto max-h-64 mb-6">
              <pre className="text-xs text-red-500 whitespace-pre-wrap font-mono">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Herlaad de pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
