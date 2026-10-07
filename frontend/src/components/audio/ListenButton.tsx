import React from 'react';
import { Volume2 } from 'lucide-react';
import type { UILanguage } from '../../types/index.js';
import { t } from '../../utils/format.js';
import { Button } from '../ui/Button.js';

interface ListenButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  currentLang: UILanguage;
}

export const ListenButton: React.FC<ListenButtonProps> = ({
  onClick,
  isLoading,
  disabled = false,
  currentLang,
}) => {
  return (
    <Button
      variant="primary"
      size="md"
      isLoading={isLoading}
      disabled={disabled}
      onClick={onClick}
      leftIcon={<Volume2 className="w-4 h-4 text-cyan-300" />}
      className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-indigo-600/30 font-semibold"
    >
      {isLoading ? t('generatingAudio', currentLang) : t('listenButton', currentLang)}
    </Button>
  );
};
