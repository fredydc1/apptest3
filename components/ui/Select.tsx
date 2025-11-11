import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  wrapperClassName?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, id, wrapperClassName, className, children, ...props }) => {
  const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={wrapperClassName || "w-full"}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${className || ''}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
