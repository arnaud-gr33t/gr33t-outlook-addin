import * as React from "react";

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary minimaliste — affiche un message d'erreur visible plutôt
 * qu'une page blanche en cas de crash React.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[Rythme] render error:", error, info);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            color: "#b00020",
            background: "#fff5f5",
            border: "1px solid #ffcccc",
            borderRadius: 8,
            margin: 24,
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>
            Erreur de rendu du dashboard Rythme
          </strong>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {this.state.error.message}
            {this.state.error.stack ? "\n\n" + this.state.error.stack : ""}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
