import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  inlineIcon?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  maxWidth?: string;
  key?: React.Key;
}

export function InfoTooltip({
  content,
  title,
  children,
  inlineIcon = false,
  position = 'top',
  className = '',
  maxWidth = 'max-w-xs sm:max-w-sm',
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {inlineIcon && (
        <span 
          className="ml-1.5 text-[#192837]/40 hover:text-[#7342E2] transition-colors cursor-help inline-flex items-center"
          aria-label="More information"
        >
          <Info size={13} />
        </span>
      )}

      {/* Floating Tooltip Popover */}
      {isVisible && (
        <div 
          className={`absolute z-50 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 ${getPositionClasses()} ${maxWidth} w-max`}
          role="tooltip"
        >
          <div className="bg-[#192837] text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs font-normal leading-relaxed text-left backdrop-blur-md">
            {title && (
              <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5 text-[#7342E2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7342E2]" />
                <span className="text-white">{title}</span>
              </div>
            )}
            <div className="text-white/90 text-xs font-medium">
              {content}
            </div>
            {/* Subtle arrow pointer */}
            <div 
              className={`absolute w-2 h-2 bg-[#192837] rotate-45 border border-white/10 ${
                position === 'bottom' 
                  ? '-top-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0' 
                  : position === 'left'
                  ? '-right-1 top-1/2 -translate-y-1/2 border-l-0 border-b-0'
                  : position === 'right'
                  ? '-left-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                  : '-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0'
              }`} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
