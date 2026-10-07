import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Download,
  Film,
  Mic,
  Sparkles,
  Wand2,
  X,
  PanelLeft,
  PanelLeftClose,
  Settings,
} from 'lucide-react';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';

interface SidebarProps {
  currentLang: UILanguage;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentLang,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenSettings,
}) => {
  const location = useLocation();

  const navItems = [
    {
      to: '/dubbing',
      icon: Film,
      title: t('navDubbing', currentLang) || 'DAI Dubber',
      isActive: location.pathname === '/dubbing' || location.pathname === '/',
    },
    {
      to: '/story',
      icon: Sparkles,
      title: t('navStudio', currentLang) || 'AI Story Studio',
      isActive: location.pathname === '/story',
    },
    {
      to: '/downloader',
      icon: Download,
      title: t('navDownloader', currentLang) || 'Downloader',
      isActive: location.pathname === '/downloader',
    },
    {
      to: '/voices',
      icon: Mic,
      title: t('navVoices', currentLang) || 'Voices',
      isActive: location.pathname === '/voices',
    },
  ];

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          /* Desktop Width */
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          /* Mobile Drawer Position */
          isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Logo */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
            <NavLink
              to="/"
              onClick={onCloseMobile}
              className="flex items-center gap-3 overflow-hidden group focus:outline-none"
            >
              <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-cyan-500 transition-colors" />
                </div>
              </div>

              {(!isCollapsed || isMobileOpen) && (
                <div className="flex items-center gap-1.5 transition-opacity duration-200">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate">
                    DUBBER
                  </span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.2 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                    PRO
                  </span>
                </div>
              )}
            </NavLink>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="p-3 space-y-6 overflow-y-auto flex-1">
            {/* Core Tools */}
            <div className="space-y-1">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.isActive;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      title={isCollapsed && !isMobileOpen ? item.title : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {(!isCollapsed || isMobileOpen) && (
                        <span className="truncate flex-1">{item.title}</span>
                      )}

                      {active && (
                        <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-sm shadow-indigo-400 animate-pulse" />
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            
            {/* Settings Button */}
            {onOpenSettings && (
              <div className="mt-8 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    onCloseMobile();
                    onOpenSettings();
                  }}
                  className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors shrink-0 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-800`}>
                    <Settings className="w-4 h-4" />
                  </div>
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate flex-1 text-left">{currentLang === 'km' ? 'ការកំណត់' : 'Settings'}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Collapse Toggle (Desktop) */}
        {onToggleCollapse && (
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0 hidden md:block">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center gap-3 p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-xs font-semibold"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-500" />
                  <span className="truncate">Collapse Sidebar</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
