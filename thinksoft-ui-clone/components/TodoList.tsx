'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  items: TodoItem[];
  onToggle?: (id: string) => void;
  compact?: boolean;
}

function TodoItemRow({ item, onToggle }: { item: TodoItem; onToggle?: (id: string) => void }) {
  const [showCheck, setShowCheck] = useState(item.completed);

  useEffect(() => {
    if (item.completed && !showCheck) {
      const timer = setTimeout(() => setShowCheck(true), 300);
      return () => clearTimeout(timer);
    }
    setShowCheck(item.completed);
  }, [item.completed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 py-1 group"
    >
      <button
        onClick={() => onToggle?.(item.id)}
        className={`relative w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center transition-all duration-300 ${
          showCheck
            ? 'bg-green-500/20 border-green-500/60'
            : 'bg-transparent border-[var(--border-strong)] hover:border-white/40'
        }`}
      >
        <AnimatePresence>
          {showCheck && (
            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Check className="w-3 h-3 text-green-400" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <span
        className={`text-[13px] leading-relaxed transition-all duration-300 ${
          showCheck
            ? 'text-[var(--text-secondary)] line-through decoration-white/20'
            : 'text-[var(--text-primary)]'
        }`}
      >
        {item.text}
      </span>
    </motion.div>
  );
}

export function TodoList({ items, onToggle, compact = false }: TodoListProps) {
  const completed = items.filter(i => i.completed).length;
  const total = items.length;

  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Tasks
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
          {completed}/{total}
        </div>
        <div className="flex-1 h-px bg-[var(--border-subtle)]" />
      </div>
      <div className="flex flex-col">
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <TodoItemRow key={item.id} item={item} onToggle={onToggle} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
