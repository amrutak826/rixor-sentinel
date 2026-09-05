export function VaultShieldLogo({ className = "w-8 h-8", color = "#192837" }: { className?: string; color?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="32" 
      height="32" 
      fill="none" 
      overflow="visible" 
      viewBox="0 0 256 256"
      className={className}
      aria-label="Rixor Logo"
    >
      <path 
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" 
        fill={color}
      />
    </svg>
  );
}

export const RixorLogo = VaultShieldLogo;
