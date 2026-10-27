import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker.ts';

// Inicializa o Service Worker com Cache API
registerServiceWorker();

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SynapseNotes Error Boundary] Erro não capturado na interface:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#141311',
          color: '#f2efe9',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#1c1b18',
            border: '1px solid #2e2b26',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#f97316' }}>
              Ocorreu uma instabilidade na interface
            </h1>
            <p style={{ fontSize: '13px', color: '#b5afa4', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              O SynapseNotes encontrou uma falha temporária ao renderizar este componente.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#141311',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#ef4444',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px',
                border: '1px solid #2e2b26',
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: '#f97316',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Recarregar Aplicação
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('synapsenotes_current_view');
                  } catch {}
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: 'transparent',
                  color: '#b5afa4',
                  border: '1px solid #2e2b26',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Limpar Cache Local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
