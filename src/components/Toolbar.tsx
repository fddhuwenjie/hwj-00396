import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import {
  Save,
  FolderOpen,
  Camera,
  Video,
  Code,
  Copy,
  Check,
  X,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '../store/editorStore';
import { PRESETS } from '../presets';
import {
  exportToJson,
  importFromJson,
  downloadScreenshot,
  recordGif,
  generateHtmlSnippet
} from '../utils/exporters';
import type { ProjectConfig } from '../types';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl glass-card shadow-glow-soft">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-auto max-h-[calc(80vh-52px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Toolbar() {
  const project = useEditorStore((s) => s.project);
  const loadPreset = useEditorStore((s) => s.loadPreset);
  const setProject = useEditorStore((s) => s.setProject);

  const [presetOpen, setPresetOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [htmlModalOpen, setHtmlModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!presetOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [presetOpen]);

  const handlePresetClick = (id: string) => {
    loadPreset(id);
    setPresetOpen(false);
  };

  const handleSaveJson = () => {
    exportToJson(project);
  };

  const handleLoadJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJson(file);
      setProject(data as ProjectConfig);
    } catch (err) {
      console.error('Failed to parse JSON:', err);
      alert('JSON 文件解析失败');
    }
    e.target.value = '';
  };

  const handleScreenshot = () => {
    const canvas = window.__particleCanvas;
    if (!canvas) {
      alert('Canvas 未就绪');
      return;
    }
    downloadScreenshot(canvas, `particle-screenshot-${Date.now()}.png`);
  };

  const handleRecordGif = async () => {
    if (recording) return;
    const canvas = window.__particleCanvas;
    const renderer = window.__particleRenderer as THREE.WebGLRenderer | null;
    const getSceneAndCamera = window.__getParticleSceneAndCamera;

    if (!canvas || !renderer || !getSceneAndCamera) {
      alert('渲染器未就绪');
      return;
    }

    const sceneAndCam = getSceneAndCamera();
    if (!sceneAndCam) {
      alert('场景未就绪');
      return;
    }

    setRecording(true);
    setRecordProgress(0);

    const duration = 3;
    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setRecordProgress(Math.min(100, (elapsed / (duration * 1000)) * 100));
    }, 50);

    try {
      const dataUrl = await recordGif(
        canvas,
        renderer,
        () => sceneAndCam,
        duration,
        15
      );
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `particle-gif-${Date.now()}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('GIF 录制失败:', err);
      alert('GIF 录制失败');
    } finally {
      clearInterval(progressTimer);
      setRecording(false);
      setRecordProgress(0);
    }
  };

  const handleExportHtml = () => {
    const code = generateHtmlSnippet(project);
    setHtmlCode(code);
    setHtmlModalOpen(true);
    setCopied(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(htmlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 border-b border-white/10 glass-panel">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent font-display font-bold tracking-wide">
              ✦ Particle Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2" ref={presetRef}>
          <div className="relative">
            <button
              onClick={() => setPresetOpen((v) => !v)}
              className={cn(
                'btn-ghost min-w-[160px] justify-between',
                presetOpen && 'bg-white/[0.08] border-white/10'
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span>预设</span>
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  presetOpen && 'rotate-180'
                )}
              />
            </button>

            {presetOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 glass-card py-1.5 z-40 shadow-glow-soft max-h-96 overflow-auto">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.08] hover:text-white transition text-left"
                  >
                    <span className="text-lg w-6 text-center">{preset.icon}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleSaveJson} className="btn-ghost" title="保存 JSON">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">保存</span>
          </button>

          <button onClick={handleLoadJson} className="btn-ghost" title="加载 JSON">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">加载</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          <button onClick={handleScreenshot} className="btn-ghost" title="截图">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">截图</span>
          </button>

          <button
            onClick={handleRecordGif}
            disabled={recording}
            className={cn(
              'btn-ghost relative overflow-hidden',
              recording && 'text-neon-orange border-neon-orange/40'
            )}
            title="录制 GIF"
          >
            {recording && recordProgress > 0 && (
              <div
                className="absolute inset-0 bg-neon-orange/20 transition-all"
                style={{ width: `${recordProgress}%` }}
              />
            )}
            <Video
              className={cn(
                'w-4 h-4 relative z-10',
                recording && 'animate-pulse'
              )}
            />
            <span className="hidden sm:inline relative z-10">
              {recording ? '录制中...' : '录制'}
            </span>
          </button>

          <button onClick={handleExportHtml} className="btn-primary" title="导出 HTML">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </header>

      <Modal
        open={htmlModalOpen}
        onClose={() => setHtmlModalOpen(false)}
        title="导出 HTML"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-end gap-2">
            <button onClick={handleCopyCode} className="btn-ghost">
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-neon-green" />
                  <span className="text-neon-green">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>复制代码</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-lg bg-abyss-950/80 border border-white/10 overflow-auto text-xs text-slate-300 font-mono max-h-96 whitespace-pre-wrap break-all">
            <code>{htmlCode}</code>
          </pre>
        </div>
      </Modal>
    </>
  );
}
