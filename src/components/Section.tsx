import React, { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEditorStore } from '../store/editorStore';

interface SectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  sectionKey?: string;
  children: ReactNode;
}

export default function Section({
  title,
  icon,
  defaultOpen = true,
  sectionKey,
  children,
}: SectionProps) {
  const collapsedSections = useEditorStore((s) => s.collapsedSections);
  const toggleSection = useEditorStore((s) => s.toggleSection);
  const [localOpen, setLocalOpen] = useState(defaultOpen);

  const isOpen = sectionKey
    ? collapsedSections[sectionKey] === undefined
      ? defaultOpen
      : !collapsedSections[sectionKey]
    : localOpen;

  const handleToggle = () => {
    if (sectionKey) {
      toggleSection(sectionKey);
    } else {
      setLocalOpen((v) => !v);
    }
  };

  return (
    <div className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1f1f1f] transition-colors"
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[#888] transition-transform duration-200 shrink-0',
            isOpen ? 'rotate-0' : '-rotate-90'
          )}
        />
        {icon && (
          <span className="text-[#888] shrink-0">{icon}</span>
        )}
        <span className="text-sm font-medium text-[#ddd]">{title}</span>
      </button>
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-3 pt-2 space-y-3 border-t border-[#2a2a2a]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
