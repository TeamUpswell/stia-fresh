import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export default function Card({
  children,
  title,
  subtitle,
  footer,
  className = "",
  titleClassName = "",
  bodyClassName = "",
  footerClassName = "",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow border border-gray-100 overflow-hidden ${className}`}
    >
      {(title || subtitle) && (
        <div className={`px-6 py-4 border-b border-gray-100 ${titleClassName}`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div
          className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${footerClassName}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
