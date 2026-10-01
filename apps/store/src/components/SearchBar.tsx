import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'ابحث عن منتج، بطاقة، أو خدمة...',
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`} dir="rtl">
      <div className="relative flex items-center">
        <div className="absolute right-4 text-muted-foreground pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-12 pr-12 pl-10 rounded-full bg-muted/70 hover:bg-muted text-foreground placeholder:text-muted-foreground text-sm font-medium border border-border/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute left-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="مسح البحث"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
