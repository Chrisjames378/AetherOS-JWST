import React from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col border border-line bg-surface/95 backdrop-blur-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-bg/50">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-flare animate-pulse" />
            <h2 className="font-mono text-xs tracking-widest text-flare uppercase">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 px-2 text-sm text-muted hover:text-fg hover:bg-raised transition-colors rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto min-h-0 flex-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
