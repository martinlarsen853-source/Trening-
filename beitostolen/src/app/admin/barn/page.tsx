'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, RefreshCw, Plus, UserPlus, Trash2 } from 'lucide-react';

type Child = {
  id: string;
  name: string;
  access_password: string;
  group_id: string;
  created_at: string;
};

type Group = { id: string; label: string; access_code: string };

export default function AdminBarnPage() {
  const [isStaff, setIsStaff] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const staff = localStorage.getItem('lederMode') === 'true';
    setIsStaff(staff);
    if (!staff) return;

    supabase.from('groups').select('id, label, access_code').eq('status', 'aktiv').order('label')
      .then(({ data }) => {
        const g = data ?? [];
        setGroups(g);
        if (g.length > 0) setSelectedGroup(g[0].id);
      });
  }, []);

  const loadChildren = useCallback(() => {
    if (!selectedGroup) return;
    setLoading(true);
    supabase.from('children')
      .select('*')
      .eq('group_id', selectedGroup)
      .order('name')
      .then(({ data }) => {
        setChildren((data ?? []) as Child[]);
        setLoading(false);
      });
  }, [selectedGroup]);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  async function addChild() {
    if (!newName.trim() || !selectedGroup) return;
    setAdding(true);
    await supabase.from('children').insert({ group_id: selectedGroup, name: newName.trim() });
    setNewName('');
    setAdding(false);
    loadChildren();
  }

  async function newCode(child: Child) {
    setRegenerating(child.id);
    await supabase.rpc('regenerate_child_password', { child_id: child.id });
    setRegenerating(null);
    loadChildren();
  }

  async function fillMissing() {
    setFilling(true);
    await supabase.rpc('fill_missing_passwords');
    setFilling(false);
    loadChildren();
  }

  async function deleteChild(id: string) {
    setDeleting(id);
    await supabase.from('children').delete().eq('id', id);
    setDeleting(null);
    loadChildren();
  }

  function copyCode(pw: string, id: string) {
    navigator.clipboard.writeText(pw).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const missingCodes = children.filter(c => !c.access_password).length;
  const currentGroup = groups.find(g => g.id === selectedGroup);

  if (!isStaff) {
    return (
      <div className="px-4 pt-20 text-center">
        <p className="text-gray-400 text-sm">Kun tilgjengelig i leder-modus.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Barn og koder</h2>
      <p className="text-sm text-gray-500 mb-5">Administrer barn og tilgangskoder per gruppe</p>

      {/* Gruppe-velger */}
      {groups.length > 1 && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                  selectedGroup === g.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Gruppe {g.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gruppe-info */}
      {currentGroup && (
        <div className="bg-blue-50 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Gruppe {currentGroup.label}</p>
            <p className="text-sm text-blue-800 font-mono font-bold mt-0.5">
              Gruppekode: {currentGroup.access_code}
            </p>
          </div>
          <button
            onClick={() => copyCode(currentGroup.access_code, 'group')}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 active:scale-95"
          >
            {copied === 'group' ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}

      {/* Legg til barn */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 py-4 mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Legg til barn</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addChild()}
            placeholder="Fullt navn…"
            className="flex-1 min-w-0 text-sm border border-gray-200 rounded-2xl px-4 py-2.5 outline-none focus:border-blue-400"
          />
          <button
            onClick={addChild}
            disabled={adding || !newName.trim()}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-40 active:scale-95 flex-shrink-0"
          >
            {adding ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
          </button>
        </div>
      </div>

      {/* Fill missing */}
      {missingCodes > 0 && (
        <button
          onClick={fillMissing}
          disabled={filling}
          className="w-full mb-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={15} />
          {filling ? 'Genererer…' : `Generer koder for ${missingCodes} barn uten kode`}
        </button>
      )}

      {/* Barneliste */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
        {children.length} barn i gruppen
      </p>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">👶</p>
          <p className="text-sm">Ingen barn i denne gruppen ennå</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {children.map(child => (
            <div
              key={child.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{child.name}</p>
                {child.access_password ? (
                  <p className="font-mono text-base font-bold text-blue-700 tracking-widest mt-0.5">
                    {child.access_password}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium mt-0.5">Mangler kode</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Kopier kode */}
                {child.access_password && (
                  <button
                    onClick={() => copyCode(child.access_password, child.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 active:scale-95"
                    title="Kopier kode"
                  >
                    {copied === child.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  </button>
                )}

                {/* Ny kode */}
                <button
                  onClick={() => newCode(child)}
                  disabled={regenerating === child.id}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 active:scale-95 disabled:opacity-40"
                  title="Generer ny kode (ugyldiggjør gammel)"
                >
                  <RefreshCw size={13} className={regenerating === child.id ? 'animate-spin' : ''} />
                </button>

                {/* Slett */}
                <button
                  onClick={() => deleteChild(child.id)}
                  disabled={deleting === child.id}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 active:scale-95 disabled:opacity-40"
                  title="Slett barn"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
