"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="max-w-2xl mx-auto p-6 bg-red-50 rounded-xl border border-red-200">
          <h3 className="font-bold text-red-800 mb-2">渲染错误</h3>
          <pre className="text-sm text-red-600 whitespace-pre-wrap break-all">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}