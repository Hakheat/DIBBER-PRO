import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { UILanguage } from '../../types/index.js';
import { useTheme } from '../../hooks/useTheme.js';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { SettingsModal } from '../ui/SettingsModal.js';

interface LayoutProps {
  children: React.ReactNode;
  currentLang: UILanguage;
  onLanguageChange: (lang: UILanguage) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentLang, onLanguageChange }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Desktop sidebar collapsed state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dubber_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Settings modal open state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dubber_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to toggle sidebar event from studio workstation
  useEffect(() => {
    const handleToggle = () => {
      if (window.innerWidth >= 768) {
        toggleDesktopSidebar();
      } else {
        toggleMobileSidebar();
      }
    };
    window.addEventListener('dubber:toggle-sidebar', handleToggle);
    return () => window.removeEventListener('dubber:toggle-sidebar', handleToggle);
  }, []);

  const isDubbingRoute = location.pathname === '/dubbing' || location.pathname === '/';

  if (isDubbingRoute) {
    return (
      <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentLang={currentLang}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleDesktopSidebar}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Full-Height DAI Dubber PRO Workstation */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {children}
        </div>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          currentLang={currentLang} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Subtle background ambient glow */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Left Sidebar (Desktop fixed/sticky, Mobile drawer) */}
      <Sidebar
        currentLang={currentLang}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleDesktopSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          currentLang={currentLang}
          onLanguageChange={onLanguageChange}
          onToggleMobileSidebar={toggleMobileSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
          {children}
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentLang={currentLang} 
      />
    </div>
  );
};
