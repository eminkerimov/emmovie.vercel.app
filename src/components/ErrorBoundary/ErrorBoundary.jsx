import React, { Component } from "react";
import "./ErrorBoundary.scss";

class ErrorBoundary extends Component {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidUpdate(previousProps) {
    if (
      this.state.hasError &&
      previousProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-state error-boundary" role="alert">
          <div className="page-container">
            <span className="error-boundary__eyebrow">Unexpected error</span>
            <h1>Something went wrong</h1>
            <p>The page could not be displayed. Reload it to try again.</p>
            <button type="button" onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
