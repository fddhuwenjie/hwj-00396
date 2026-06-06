import { Activity, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '../store/editorStore';

export default function StatusBar() {
  const fps = useEditorStore((s) => s.fps);
  const activeParticleCount = useEditorStore((s) => s.activeParticleCount);
  const activeEmitterId = useEditorStore((s) => s.activeEmitterId);
  const emitters = useEditorStore((s) => s.project.emitters);

  const activeEmitter = emitters.find((e) => e.id === activeEmitterId);

  const fpsColor =
    fps < 15 ? 'text-red-400' : fps < 30 ? 'text-neon-orange' : 'text-neon-green';
  const fpsDotColor =
    fps < 15 ? 'bg-red-400' : fps < 30 ? 'bg-neon-orange' : 'bg-neon-green';

  return (
    <div className="h-8 flex items-center justify-between px-4 border-t border-white/10 glass-panel text-xs font-mono">
      <div className="flex items-center gap-2 text-slate-400">
        <Activity className={cn('w-3.5 h-3.5', fpsColor)} />
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse-slow',
            fpsDotColor
          )}
        />
        <span className={fpsColor}>{fps.toFixed(0)}</span>
        <span className="text-slate-600">FPS</span>
      </div>

      <div className="flex items-center gap-2 text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
        <span className="text-slate-300">{activeParticleCount.toLocaleString()}</span>
        <span className="text-slate-600">活跃粒子</span>
      </div>

      <div className="flex items-center gap-2 text-slate-400">
        {activeEmitter ? (
          <>
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                activeEmitter.enabled ? 'bg-neon-green' : 'bg-slate-600'
              )}
            />
            <span className="text-slate-300">{activeEmitter.name}</span>
            <span className="text-slate-600">
              {activeEmitter.rate}/s · {activeEmitter.enabled ? '运行中' : '已停用'}
            </span>
          </>
        ) : (
          <span className="text-slate-600">未选择发射器</span>
        )}
      </div>
    </div>
  );
}
