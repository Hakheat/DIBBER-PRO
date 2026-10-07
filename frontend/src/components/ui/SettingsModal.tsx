import React, { useEffect, useState } from 'react';
import { Settings, X, Save, Key } from 'lucide-react';
import { Button } from './Button.js';
import type { UILanguage } from '../../types/index.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: UILanguage;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentLang }) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch current settings
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.geminiApiKey) {
            setGeminiApiKey(data.geminiApiKey);
          }
          if (data.geminiModel) {
            setGeminiModel(data.geminiModel);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          geminiApiKey: geminiApiKey.trim() || undefined,
          geminiModel: geminiModel
        }),
      });
      
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {currentLang === 'km' ? 'ការកំណត់ (Settings)' : 'Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            
            {/* API Keys Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Configuration
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Gemini AI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      onFocus={() => {
                        if (geminiApiKey === '********') {
                          setGeminiApiKey('');
                        }
                      }}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentLang === 'km' 
                      ? 'ប្រើប្រាស់សម្រាប់ដំណើរការការបកប្រែ និងសង្ខេបអត្ថបទដ៏ឆ្លាតវៃ។' 
                      : 'Used for intelligent translation and summarization.'}
                  </p>
                </div>

                {/* Gemini Model Selection */}
                <div className="space-y-2 mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {currentLang === 'km' ? 'ជ្រើសរើស AI Model' : 'Select AI Model'}
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (លឿន និងសន្សំសំចៃ)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (ឆ្លាតវៃ និងច្បាស់លាស់)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (ជំនាន់ថ្មី)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-5 py-2.5"
          >
            {currentLang === 'km' ? 'បិទ' : 'Cancel'}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            leftIcon={isSaving ? undefined : <Save className="w-4 h-4" />}
            className="px-6 py-2.5 min-w-[120px]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : saveSuccess ? (
              currentLang === 'km' ? 'បានរក្សាទុក!' : 'Saved!'
            ) : (
              currentLang === 'km' ? 'រក្សាទុក' : 'Save Settings'
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
