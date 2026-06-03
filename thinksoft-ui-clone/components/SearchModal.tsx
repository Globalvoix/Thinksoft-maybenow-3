import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Compass, Book, Sparkles, Settings, User, Users, CreditCard, Cloud, Lock, Blocks, ArrowUpRight, CornerDownLeft, Folder } from 'lucide-react';

const ProjectIcon = ({ size = 14, className, strokeWidth = 1.5 }: { size?: number, className?: string, strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2l10 10-10 10L2 12 12 2z" />
  </svg>
);

const DashboardIcon = ({ size = 14, className, strokeWidth = 1.5 }: { size?: number, className?: string, strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

type SearchItem = {
  id: string;
  section: 'Recent projects' | 'Navigate to' | 'Settings';
  label: string;
  icon: React.ElementType;
  external?: boolean;
  image?: string;
  createdBy?: string;
  status?: string;
  created?: string;
  lastEdited?: string;
  lastOpened?: string;
};

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'p1',
    section: 'Recent projects',
    label: 'Vibe Clone Studio',
    icon: ProjectIcon,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    createdBy: 'Prasuk Jain',
    status: 'Private',
    created: '1 day ago',
    lastEdited: '1 day ago',
    lastOpened: '1 day ago'
  },
  {
    id: 'p2',
    section: 'Recent projects',
    label: 'Landing Page Spark',
    icon: ProjectIcon,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2666&auto=format&fit=crop',
    createdBy: 'Prasuk Jain',
    status: 'Private',
    created: '24 Dec 2025',
    lastEdited: '29 days ago',
    lastOpened: '1 day ago'
  },
  { id: 'p3', section: 'Recent projects', label: 'SchoolDash Premium', icon: ProjectIcon },
  { id: 'p4', section: 'Recent projects', label: 'Stream Central (82)', icon: ProjectIcon },
  { id: 'p5', section: 'Recent projects', label: 'Stream Scene', icon: ProjectIcon },
  
  { id: 'n1', section: 'Navigate to', label: 'Dashboard', icon: DashboardIcon },
  { id: 'n2', section: 'Navigate to', label: 'Create new project', icon: Plus },
  { id: 'n3', section: 'Navigate to', label: 'Discover', icon: Compass },
  { id: 'n4', section: 'Navigate to', label: 'Documentation', icon: Book, external: true },
  { id: 'n5', section: 'Navigate to', label: 'Changelog', icon: Sparkles, external: true },

  { id: 's1', section: 'Settings', label: 'Workspace', icon: Settings },
  { id: 's2', section: 'Settings', label: 'Your account', icon: User },
  { id: 's3', section: 'Settings', label: 'People', icon: Users },
  { id: 's4', section: 'Settings', label: 'Plans & credits', icon: CreditCard },
  { id: 's5', section: 'Settings', label: 'Cloud & AI balance', icon: Cloud },
  { id: 's6', section: 'Settings', label: 'Privacy & security', icon: Lock },
  { id: 's7', section: 'Settings', label: 'Connectors', icon: Blocks },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredItems = SEARCH_ITEMS.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems.length, onClose]);

  // Update selected index if it goes out of bounds after filtering
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const selectedItem = filteredItems[selectedIndex];
  const isProjectSelected = selectedItem?.section === 'Recent projects';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, width: 560 }}
            animate={{ opacity: 1, scale: 1, y: 0, width: isProjectSelected ? 820 : 560 }}
            exit={{ opacity: 0, scale: 0.95, y: -20, width: isProjectSelected ? 820 : 560 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[#1c1c1c] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[460px] max-w-[90vw]"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 h-[52px] border-b border-white/[0.06] shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-white/40"
              />
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* List */}
              <div 
                ref={listRef}
                className={`flex-1 overflow-y-auto py-2 ${isProjectSelected ? 'border-r border-white/[0.06]' : ''} [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full`}
              >
                {['Recent projects', 'Navigate to', 'Settings'].map((section) => {
                  const sectionItems = filteredItems.filter(item => item.section === section);
                  if (sectionItems.length === 0) return null;

                  return (
                    <div key={section} className="mb-4 last:mb-0">
                      <div className="px-4 py-1.5 text-[11px] font-medium text-white/40">
                        {section}
                      </div>
                      <div className="px-2 flex flex-col gap-0.5">
                        {sectionItems.map((item) => {
                          const index = filteredItems.indexOf(item);
                          const isSelected = index === selectedIndex;
                          const Icon = item.icon;

                          return (
                            <div
                              key={item.id}
                              data-selected={isSelected}
                              onMouseEnter={() => setSelectedIndex(index)}
                              onClick={() => onClose()}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-[#2563eb] text-white' : 'text-white/90 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon size={15} strokeWidth={1.5} className={isSelected ? 'text-white' : 'text-white/70'} />
                                <span className="text-[13px] font-medium">{item.label}</span>
                              </div>
                              {item.external && (
                                <ArrowUpRight size={14} strokeWidth={1.5} className={isSelected ? 'text-white/70' : 'text-white/40'} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preview Panel */}
              {isProjectSelected && (
                <div className="w-[360px] flex-shrink-0 bg-[#1c1c1c] p-5 flex flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {selectedItem.image ? (
                    <div className="w-full h-[200px] rounded-lg overflow-hidden border border-white/[0.06]">
                      <img src={selectedItem.image} alt={selectedItem.label} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-[200px] rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                      <ProjectIcon size={24} strokeWidth={1.5} className="text-white/20" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4">
                    <h3 className="text-white text-[16px] font-semibold">{selectedItem.label}</h3>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/40 text-[11px]">Created by</span>
                        <span className="text-white/90 text-[12px]">{selectedItem.createdBy || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/40 text-[11px]">Status</span>
                        <span className="text-white/90 text-[12px]">{selectedItem.status || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/40 text-[11px]">Created</span>
                        <span className="text-white/90 text-[12px]">{selectedItem.created || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/40 text-[11px]">Last edited</span>
                        <span className="text-white/90 text-[12px]">{selectedItem.lastEdited || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/40 text-[11px]">Last opened</span>
                        <span className="text-white/90 text-[12px]">{selectedItem.lastOpened || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="h-10 border-t border-white/[0.06] shrink-0 flex items-center justify-between px-4 bg-[#1c1c1c]">
              <Folder size={14} strokeWidth={1.5} className="text-white/40" fill="currentColor" />
              <div className="flex items-center gap-2 text-white/50">
                <span className="text-[12px]">
                  {selectedItem?.section === 'Recent projects' ? 'Open project' : 
                   selectedItem?.section === 'Settings' ? 'Open settings' : 'Open'}
                </span>
                <div className="w-5 h-5 rounded bg-white/[0.05] flex items-center justify-center">
                  <CornerDownLeft size={12} strokeWidth={1.5} className="text-white/70" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
