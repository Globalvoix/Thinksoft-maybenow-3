'use client';

import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface Secret {
  id: string;
  name: string;
  dateStr: string;
  badge?: string;
}

export function SecretsView() {
  const [secrets] = useState<Secret[]>([
    { id: '1', name: 'LOVABLE_API_KEY', dateStr: 'Mar 8, 2026', badge: 'Lovable' }
  ]);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');

  return (
    <div className="flex-1 flex flex-col mr-2 mb-2 p-8 border border-[#2a2a2a] rounded-2xl bg-[#141416] overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full pt-2">
        <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight">Add new secret</h2>
        <p className="text-[#a1a1aa] mb-6 text-[13px]">
          Secrets securely save sensitive information like API keys.
        </p>

        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-[13px] font-bold text-white mb-1.5 tracking-wide">Name</label>
            <input
              type="text"
              placeholder="SECRET_NAME"
              value={newSecretName}
              onChange={(e) => setNewSecretName(e.target.value)}
              className="w-full bg-transparent border border-[#3f3f46] rounded-lg px-3 py-1.5 text-[#e4e4e7] placeholder:text-[#52525b] outline-none focus:border-[#52525b] transition-colors font-medium text-[13px]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[13px] font-bold text-white mb-1.5 tracking-wide">Value</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newSecretValue}
              onChange={(e) => setNewSecretValue(e.target.value)}
              className="w-full bg-transparent border border-[#3f3f46] rounded-lg px-3 py-1.5 text-[#e4e4e7] placeholder:text-[#52525b] outline-none focus:border-[#52525b] transition-colors tracking-widest text-[13px]"
            />
          </div>
          <button className="flex items-center justify-center p-[7px] border border-[#3f3f46] rounded-lg text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-10">
          <button className="flex items-center px-3 py-1.5 border border-[#3f3f46] rounded-lg text-[13px] font-medium text-white hover:bg-[#27272a] transition-colors gap-1.5">
            <Plus className="w-4 h-4" />
            Add another
          </button>
          <button className="px-4 py-1.5 bg-[#3b5bfb] hover:bg-[#3451e0] text-[#e0e7ff] text-[13px] font-semibold rounded-lg transition-colors">
            Save
          </button>
        </div>

        <h2 className="text-lg font-bold text-white mb-4 tracking-tight">Saved secrets</h2>

        <div className="bg-[#141416] border border-[#3f3f46]/60 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1c1c1e] border-b border-[#3f3f46]/60">
              <tr>
                <th className="px-4 py-3 text-[13px] font-bold text-[#a1a1aa] w-[45%]">Name</th>
                <th className="px-4 py-3 text-[13px] font-bold text-[#a1a1aa] w-[45%]">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => (
                <tr key={secret.id} className="last:border-0 hover:bg-[#27272a]/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] text-white font-bold">{secret.name}</span>
                      {secret.badge && (
                        <span className="px-1.5 py-0.5 text-[11px] font-medium bg-[#27272a] text-[#e4e4e7] rounded">
                          {secret.badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-[#e4e4e7] font-medium">
                    {secret.dateStr}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button className="px-3 py-1 border border-[#3f3f46]/60 rounded-lg text-[12px] text-white font-semibold hover:bg-[#3f3f46]/50 transition-colors">
                        Rotate
                      </button>
                      <button className="p-1 text-[#a1a1aa] hover:text-[#ef4444] transition-colors">
                        <Trash2 className="w-[15px] h-[15px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
