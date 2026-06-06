import { Plus, Trash2, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '../store/editorStore';

export default function EmitterList() {
  const emitters = useEditorStore((s) => s.project.emitters);
  const activeEmitterId = useEditorStore((s) => s.activeEmitterId);
  const addEmitter = useEditorStore((s) => s.addEmitter);
  const removeEmitter = useEditorStore((s) => s.removeEmitter);
  const updateEmitter = useEditorStore((s) => s.updateEmitter);
  const setActiveEmitter = useEditorStore((s) => s.setActiveEmitter);

  const handleToggleEnabled = (e: React.MouseEvent, id: string, currentEnabled: boolean) => {
    e.stopPropagation();
    updateEmitter(id, { enabled: !currentEnabled });
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeEmitter(id);
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel border-r border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Power className="w-4 h-4 text-neon-cyan" />
          发射器
        </h2>
        <button
          onClick={() => addEmitter()}
          className="p-1.5 rounded-md text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 transition"
          title="添加发射器"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {emitters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <div className="text-4xl mb-3 opacity-40">✨</div>
            <p>暂无发射器</p>
            <p className="text-xs text-slate-600 mt-1">点击 + 添加</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {emitters.map((emitter) => {
              const isActive = emitter.id === activeEmitterId;
              return (
                <div
                  key={emitter.id}
                  onClick={() => setActiveEmitter(emitter.id)}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200',
                    isActive
                      ? 'bg-neon-cyan/10 border border-neon-cyan/40 shadow-glow'
                      : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/10'
                  )}
                >
                  <button
                    onClick={(e) => handleToggleEnabled(e, emitter.id, emitter.enabled)}
                    className={cn(
                      'w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200',
                      emitter.enabled
                        ? 'bg-neon-green shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                        : 'bg-slate-600'
                    )}
                    title={emitter.enabled ? '点击停用' : '点击启用'}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm truncate',
                        isActive ? 'text-white font-medium' : 'text-slate-300',
                        !emitter.enabled && 'opacity-50'
                      )}
                    >
                      {emitter.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {emitter.shape} · {emitter.rate}/s
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleRemove(e, emitter.id)}
                    className={cn(
                      'p-1.5 rounded-md transition-all duration-200',
                      'opacity-0 group-hover:opacity-100',
                      'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                    )}
                    title="删除发射器"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
