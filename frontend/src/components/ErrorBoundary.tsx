import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-gray-500 mb-6">عذراً، حدث خطأ في تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.</p>
          <button
            onClick={this.handleReset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
