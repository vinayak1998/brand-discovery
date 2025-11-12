import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useGATracking } from '@/hooks/useGATracking';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Hook wrapper for GA tracking in class component
let trackErrorFunc: ((error: Error, errorInfo: ErrorInfo) => void) | null = null;

export const ErrorBoundaryWithTracking = ({ children }: Props) => {
  const { trackError } = useGATracking();
  
  React.useEffect(() => {
    trackErrorFunc = (error: Error, errorInfo: ErrorInfo) => {
      trackError({
        action: 'load_error',
        error_message: error.message,
        error_context: errorInfo.componentStack?.substring(0, 500) || 'React Error Boundary',
      });
    };
  }, [trackError]);

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Track error via GA
    if (trackErrorFunc) {
      trackErrorFunc(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              We've been notified and are working on a fix. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
