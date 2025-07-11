import React from 'react';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

export function PillButton({ selected, children, ...props }: PillButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        selected
          ? "bg-blue-500 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {children}
    </button>
  );
} 