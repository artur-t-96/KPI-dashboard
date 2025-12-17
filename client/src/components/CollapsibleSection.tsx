import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerClassName?: string;
  icon?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
  headerClassName = 'bg-gray-800 text-white',
  icon
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity ${headerClassName}`}
      >
        <div className="text-left">
          <h3 className="font-semibold flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm opacity-75 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  );
}
