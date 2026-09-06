import React from 'react';
import { Navbar } from './Navbar.js';
import { Footer } from './Footer.js';

interface PageContainerProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-10 w-[450px] h-[450px] bg-violet-600/8 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-1/3 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main className={`flex-1 relative z-10 ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'}`}>
        {children}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
