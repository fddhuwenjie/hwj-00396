import {
  Zap,
  Sparkles,
  Globe,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '../store/editorStore';
import type {
  EmitShape,
  TextureType,
  Vec3,
  ColorStop,
  Attractor,
  BezierPoint
} from '../types';
import Section from './Section';
import Slider from './Slider';
import BezierEditor from './BezierEditor';
import ColorGradientEditor from './ColorGradientEditor';

interface RowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function Row({ label, children, className }: RowProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs text-[#888]">{label}</label>
      <div className="w-full">{children}</div>
    </div>
  );
}

interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

function NumInput({ value, onChange, min, max, step = 1, placeholder }: NumInputProps) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) {
          let final = v;
          if (min !== undefined) final = Math.max(min, final);
          if (max !== undefined) final = Math.min(max, final);
          onChange(final);
        }
      }}
      className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded px-2 text-sm text-white font-mono focus:outline-none focus:border-[#7c5cff] transition"
    />
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors duration-200',
        checked ? 'bg-[#7c5cff]' : 'bg-[#333]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

interface Vec3InputProps {
  value: Vec3;
  onChange: (v: Vec3) => void;
  step?: number;
}

function Vec3Input({ value, onChange, step = 0.1 }: Vec3InputProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['x', 'y', 'z'] as const).map((axis) => (
        <div key={axis} className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#666] font-mono uppercase pointer-events-none">
            {axis}
          </span>
          <input
            type="number"
            step={step}
            value={Number.isFinite(value[axis]) ? value[axis] : 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v)) {
                onChange({ ...value, [axis]: v });
              }
            }}
            className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded pl-6 pr-2 text-sm text-white font-mono focus:outline-none focus:border-[#7c5cff] transition"
          />
        </div>
      ))}
    </div>
  );
}

const SHAPE_OPTIONS: { value: EmitShape; label: string }[] = [
  { value: 'point', label: '点' },
  { value: 'sphere', label: '球体' },
  { value: 'cone', label: '锥体' },
  { value: 'rect', label: '矩形' },
  { value: 'box', label: '立方体' }
];

const TEXTURE_OPTIONS: { value: TextureType | string; label: string }[] = [
  { value: 'circle', label: '圆形' },
  { value: 'star', label: '星形' },
  { value: 'spark', label: '火花' },
  { value: 'square', label: '方形' },
  { value: 'smoke', label: '烟雾' },
  { value: 'ring', label: '环形' }
];

export default function ParamPanel() {
  const project = useEditorStore((s) => s.project);
  const activeEmitterId = useEditorStore((s) => s.activeEmitterId);
  const updateEmitter = useEditorStore((s) => s.updateEmitter);
  const updateAttractor = useEditorStore((s) => s.updateAttractor);
  const removeAttractor = useEditorStore((s) => s.removeAttractor);
  const addAttractor = useEditorStore((s) => s.addAttractor);
  const setGlobalGravity = useEditorStore((s) => s.setGlobalGravity);
  const setGlobalWind = useEditorStore((s) => s.setGlobalWind);

  const emitter = project.emitters.find((e) => e.id === activeEmitterId);

  if (!emitter) {
    return (
      <div className="w-full h-full flex flex-col glass-panel border-l border-white/10">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm p-6 text-center">
          <div className="text-5xl mb-4 opacity-30">🎛️</div>
          <p className="text-slate-400">请先选择或创建一个发射器</p>
          <p className="text-xs text-slate-600 mt-2">在左侧列表中选择一个发射器，或点击 + 新建</p>
        </div>
      </div>
    );
  }

  const patchEmitter = (patch: Partial<typeof emitter>) => {
    updateEmitter(emitter.id, patch);
  };

  return (
    <div className="w-full h-full flex flex-col border-l border-[#2a2a2a] bg-[#0d0d0d] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between flex-shrink-0 bg-[#131313]">
        <h2 className="text-sm font-semibold text-[#ddd]">参数面板</h2>
        <span className="text-[11px] text-[#888] font-mono px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
          {project.emitters.length} 个发射器
        </span>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <Section title="发射器设置" icon={<Zap className="w-4 h-4" />} sectionKey="emitter">
          <Row label="名称">
            <input
              type="text"
              value={emitter.name}
              onChange={(e) => patchEmitter({ name: e.target.value })}
              className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded px-2 text-sm text-white focus:outline-none focus:border-[#7c5cff] transition"
            />
          </Row>

          <Row label="启用">
            <Switch
              checked={emitter.enabled}
              onChange={(v) => patchEmitter({ enabled: v })}
            />
          </Row>

          <Row label="发射形状">
            <select
              value={emitter.shape}
              onChange={(e) => patchEmitter({ shape: e.target.value as EmitShape })}
              className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded px-2 text-sm text-white focus:outline-none focus:border-[#7c5cff] transition"
            >
              {SHAPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>

          <Row label="位置">
            <Vec3Input
              value={emitter.position}
              onChange={(v) => patchEmitter({ position: v })}
            />
          </Row>

          <Slider
            label="发射速率"
            value={emitter.rate}
            min={0}
            max={500}
            step={1}
            onChange={(v) => patchEmitter({ rate: v })}
          />

          <Slider
            label="生命周期 (秒)"
            value={emitter.lifetime}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => patchEmitter({ lifetime: v })}
          />

          {(emitter.shape === 'sphere' || emitter.shape === 'point') && (
            <Row label="球半径">
              <NumInput
                value={emitter.shapeParams.sphereRadius ?? emitter.shapeParams.radius ?? 1}
                min={0}
                step={0.1}
                onChange={(v) =>
                  patchEmitter({
                    shapeParams: { ...emitter.shapeParams, sphereRadius: v, radius: v }
                  })
                }
              />
            </Row>
          )}

          {emitter.shape === 'cone' && (
            <>
              <Row label="锥角度">
                <NumInput
                  value={emitter.shapeParams.coneAngle ?? emitter.shapeParams.angle ?? 0.5}
                  min={0}
                  max={Math.PI}
                  step={0.05}
                  onChange={(v) =>
                    patchEmitter({
                      shapeParams: { ...emitter.shapeParams, coneAngle: v, angle: v }
                    })
                  }
                />
              </Row>
              <Row label="锥高度">
                <NumInput
                  value={emitter.shapeParams.coneHeight ?? 1}
                  min={0}
                  step={0.1}
                  onChange={(v) =>
                    patchEmitter({
                      shapeParams: { ...emitter.shapeParams, coneHeight: v }
                    })
                  }
                />
              </Row>
            </>
          )}

          {(emitter.shape === 'rect' || emitter.shape === 'box') && (
            <>
              <Row label="宽度">
                <NumInput
                  value={emitter.shapeParams.rectWidth ?? emitter.shapeParams.width ?? 1}
                  min={0}
                  step={0.1}
                  onChange={(v) =>
                    patchEmitter({
                      shapeParams: { ...emitter.shapeParams, rectWidth: v, width: v }
                    })
                  }
                />
              </Row>
              <Row label="高度">
                <NumInput
                  value={emitter.shapeParams.rectHeight ?? emitter.shapeParams.height ?? 1}
                  min={0}
                  step={0.1}
                  onChange={(v) =>
                    patchEmitter({
                      shapeParams: { ...emitter.shapeParams, rectHeight: v, height: v }
                    })
                  }
                />
              </Row>
              {emitter.shape === 'box' && (
                <Row label="深度">
                  <NumInput
                    value={emitter.shapeParams.rectDepth ?? emitter.shapeParams.depth ?? 1}
                    min={0}
                    step={0.1}
                    onChange={(v) =>
                      patchEmitter({
                        shapeParams: { ...emitter.shapeParams, rectDepth: v, depth: v }
                      })
                    }
                  />
                </Row>
              )}
            </>
          )}

          <Slider
            label="速度最小"
            value={emitter.speedMin}
            min={0}
            max={20}
            step={0.1}
            onChange={(v) => patchEmitter({ speedMin: v })}
          />

          <Slider
            label="速度最大"
            value={emitter.speedMax}
            min={0}
            max={20}
            step={0.1}
            onChange={(v) => patchEmitter({ speedMax: v })}
          />

          <Slider
            label="方向扩散角度"
            value={emitter.spread}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patchEmitter({ spread: v, directionSpread: v })}
          />
        </Section>

        <Section title="粒子属性" icon={<Sparkles className="w-4 h-4" />} sectionKey="particle">
          <Slider
            label="大小起始"
            value={emitter.sizeStart}
            min={0}
            max={5}
            step={0.01}
            onChange={(v) => patchEmitter({ sizeStart: v })}
          />

          <Slider
            label="大小结束"
            value={emitter.sizeEnd}
            min={0}
            max={5}
            step={0.01}
            onChange={(v) => patchEmitter({ sizeEnd: v })}
          />

          <Row label="大小曲线">
            <BezierEditor
              value={
                Array.isArray(emitter.sizeCurve) &&
                emitter.sizeCurve.length === 4 &&
                typeof emitter.sizeCurve[0] === 'number'
                  ? (emitter.sizeCurve as [number, number, number, number])
                  : ([1, 1, 0, 0] as [number, number, number, number])
              }
              onChange={(v: BezierPoint[]) => patchEmitter({ sizeCurve: v })}
            />
          </Row>

          <Row label="颜色渐变">
            <ColorGradientEditor
              value={(emitter.colorStops ?? emitter.colorGradient ?? []) as ColorStop[]}
              onChange={(v: ColorStop[]) => patchEmitter({ colorStops: v, colorGradient: v })}
            />
          </Row>

          <Slider
            label="透明度起始"
            value={emitter.alphaStart}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patchEmitter({ alphaStart: v })}
          />

          <Slider
            label="透明度结束"
            value={emitter.alphaEnd}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patchEmitter({ alphaEnd: v })}
          />

          <Slider
            label="旋转速度"
            value={emitter.rotationSpeed}
            min={-10}
            max={10}
            step={0.1}
            onChange={(v) => patchEmitter({ rotationSpeed: v })}
          />

          <Row label="纹理类型">
            <select
              value={emitter.textureType}
              onChange={(e) => patchEmitter({ textureType: e.target.value })}
              className="w-full h-8 bg-[#1a1a1a] border border-[#333] rounded px-2 text-sm text-white focus:outline-none focus:border-[#7c5cff] transition"
            >
              {TEXTURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title="物理效果" icon={<Globe className="w-4 h-4" />} sectionKey="physics">
          <Slider
            label="重力系数"
            value={emitter.gravityFactor}
            min={0}
            max={3}
            step={0.01}
            onChange={(v) => patchEmitter({ gravityFactor: v })}
          />

          <Slider
            label="风力系数"
            value={emitter.windFactor}
            min={0}
            max={3}
            step={0.01}
            onChange={(v) => patchEmitter({ windFactor: v })}
          />

          <Slider
            label="吸引子强度"
            value={emitter.attractorStrength}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => patchEmitter({ attractorStrength: v })}
          />

          <Slider
            label="速度阻尼"
            value={emitter.damping}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patchEmitter({ damping: v })}
          />

          <Row label="启用粒子碰撞 (地面反弹)">
            <Switch
              checked={emitter.collisionEnabled}
              onChange={(v) => patchEmitter({ collisionEnabled: v })}
            />
          </Row>
        </Section>

        <Section title="全局设置" icon={<Settings className="w-4 h-4" />} sectionKey="global">
          <Row label="全局重力">
            <Vec3Input
              value={project.globalGravity}
              onChange={(v) => setGlobalGravity(v)}
            />
          </Row>

          <Row label="全局风力">
            <Vec3Input
              value={project.globalWind}
              onChange={(v) => setGlobalWind(v)}
            />
          </Row>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#888]">吸引子列表</span>
              <button
                onClick={() =>
                  addAttractor(
                    { x: 0, y: 0, z: 0 },
                    10,
                    3
                  )
                }
                className="p-1 rounded text-[#888] hover:text-[#7c5cff] hover:bg-[#7c5cff]/10 transition"
                title="添加吸引子"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {project.attractors.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#555] border border-dashed border-[#2a2a2a] rounded-lg">
                暂无吸引子，点击 + 添加（或在视口中点击地面）
              </div>
            ) : (
              <div className="space-y-2">
                {project.attractors.map((attractor: Attractor) => (
                  <div
                    key={attractor.id}
                    className="p-3 rounded-lg bg-[#131313] border border-[#2a2a2a] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#666] font-mono">
                        #{attractor.id.slice(0, 6)}
                      </span>
                      <button
                        onClick={() => removeAttractor(attractor.id)}
                        className="p-1 text-[#666] hover:text-red-400 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Row label="位置">
                      <Vec3Input
                        value={attractor.position}
                        onChange={(v: Vec3) => updateAttractor(attractor.id, { position: v })}
                      />
                    </Row>
                    <Slider
                      label="强度"
                      value={attractor.strength}
                      min={-50}
                      max={50}
                      step={1}
                      onChange={(v) => updateAttractor(attractor.id, { strength: v })}
                    />
                    <Slider
                      label="半径"
                      value={attractor.radius}
                      min={0.1}
                      max={20}
                      step={0.1}
                      onChange={(v) => updateAttractor(attractor.id, { radius: v })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
