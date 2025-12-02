import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-yellow-400 text-yellow-950 hover:bg-yellow-500 focus:ring-yellow-400 shadow-sm border border-transparent",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-200 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 focus:ring-red-500"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;