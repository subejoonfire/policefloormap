"use client";
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#222222] flex items-center justify-center text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Terjadi kesalahan</h1>
            <p className="text-gray-300 mb-4">
              Aplikasi mengalami masalah. Silakan refresh halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#C0A062] text-white px-6 py-2 rounded hover:bg-[#A08A52] transition-colors"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;