import { X } from 'lucide-react';
import React from 'react';

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export const FilterTag: React.FC<FilterTagProps> = ({ label, onRemove }) => {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-bg-tertiary-light dark:bg-bg-tertiary-dark text-text-primary-light dark:text-text-primary-dark rounded-md text-sm">
      {label}
      <button
        aria-label={`移除${label}筛选`}
        className="p-0.5 hover:bg-hover-bg-light dark:hover:bg-hover-bg-dark rounded-full transition-colors"
        type="button"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
