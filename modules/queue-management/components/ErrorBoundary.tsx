
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  public props: any;
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-rose-100 p-10 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
              <AlertTriangle size={48} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Đã có lỗi xảy ra</h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Hệ thống gặp sự cố không mong muốn. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl text-left mb-8 overflow-hidden">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Chi tiết lỗi:</p>
               <p className="text-xs font-mono text-rose-600 break-words">{this.state.error?.message}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <RefreshCcw size={16} /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}

export default ErrorBoundary;
