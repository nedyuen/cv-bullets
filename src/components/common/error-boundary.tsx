import { Component, type ErrorInfo, type ReactNode } from "react";

// Keeps a crash in one page from blanking the whole app (sidebar included).
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">This page hit an error</p>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{this.state.error.message}</pre>
      </div>
    );
  }
}
