import React from 'react';

interface AuthDividerProps {
  text?: string;
  subtext?: string;
  className?: string;
}

const AuthDivider: React.FC<AuthDividerProps> = ({ text = "OR", subtext, className = "" }) => {
  return (
    <div className={`relative flex flex-col items-center py-6 ${className}`} id="auth-divider">
      <div className="w-full flex items-center">
        <div className="flex-grow border-t border-black/10" id="auth-divider-line-left"></div>
        <span className="flex-shrink mx-4 text-black/40 font-bold uppercase tracking-widest text-[10px]" id="auth-divider-text">
          {text}
        </span>
        <div className="flex-grow border-t border-black/10" id="auth-divider-line-right"></div>
      </div>
      {subtext && (
        <span className="mt-2 text-black/40 font-bold uppercase tracking-widest text-[10px]" id="auth-divider-subtext">
          {subtext}
        </span>
      )}
    </div>
  );
};

export default AuthDivider;
