import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <div
        className={`${sizeClasses[size]} border-t-saffron border-r-transparent border-b-deep-blue border-l-transparent rounded-full animate-spin`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
