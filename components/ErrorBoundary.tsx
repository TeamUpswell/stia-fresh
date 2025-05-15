"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <div className="bg-red-50 p-4 rounded-lg mb-4 text-left">
            <p className="font-mono text-sm text-red-800 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}