'use client';

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function CompanyLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative bg-white rounded-lg p-1 shadow-sm overflow-hidden`}>
        <Image
          src="/images/company-logo.jpg"
          alt="Wilson Cars & Wash Logo"
          width={48}
          height={48}
          className="w-full h-full object-contain rounded"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-current leading-tight ${textSizeClasses[size]}`}>
            Wilson Cars & Wash
          </span>
          <span className="text-xs opacity-70 leading-tight">
            Parking Professional
          </span>
        </div>
      )}
    </div>
  );
}