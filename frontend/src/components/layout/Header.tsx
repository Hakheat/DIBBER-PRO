import React from 'react';
import {
  Globe,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Sun,
} from 'lucide-react';
import type { UILanguage } from '../../types/index.js';
import type { Theme } from '../../hooks/useTheme.js';
import { t } from '../../utils/format.js';

interface HeaderProps {
  currentLang: UILanguage;
  onLanguageChange: (lang: UILanguage) => void;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleDesktopSidebar: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleDesktopSidebar,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Sidebar Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 md:hidden transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden md:flex p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 transition-colors shrink-0"
            title={isSidebarCollapsed ? t('expandSidebar', currentLang) : t('collapseSidebar', currentLang)}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>
        </div>

        {/* Right: Theme Switcher & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-inner flex items-center justify-center"
              title={currentLang === 'km' ? 'ការកំណត់' : 'Settings'}
              aria-label="Open Settings"
            >
              <svg className="w-4 h-4 transition-transform hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Theme Toggle Button (Light/Dark Mode) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-inner flex items-center justify-center"
            title={theme === 'dark' ? t('themeLight', currentLang) : t('themeDark', currentLang)}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Clean Segmented Language Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                currentLang === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('km')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all font-khmer flex items-center gap-1 ${
                currentLang === 'km'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>ខ្មែរ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
