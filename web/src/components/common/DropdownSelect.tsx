import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface DropdownSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glow';
}

export function DropdownSelect<T = string | number>({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  size = 'md',
  variant = 'default',
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-3.5 text-xs',
    lg: 'py-2.5 px-4 text-sm',
  };

  const borderClasses =
    variant === 'glow'
      ? 'border border-indigo-500/50 hover:border-indigo-400 shadow-lg shadow-indigo-500/10'
      : 'border border-slate-700/80 hover:border-indigo-500/50 shadow-md';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl bg-[#0c101c] ${borderClasses} text-white font-semibold transition-all duration-200 cursor-pointer ${
          isOpen ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''
        } ${sizeClasses[size]}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          <span className="truncate font-bold">{selectedOption ? selectedOption.label : placeholder}</span>
          {selectedOption?.badge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[220px] rounded-2xl bg-[#0c101c]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-1.5 space-y-1 max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600/25 text-white border border-indigo-500/50 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        isSelected
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
