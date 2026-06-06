import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { useEditorStore } from '../store/editorStore';
import { ParticleEngine } from '../engine/ParticleEngine';
import { setViewportRefs } from '../utils/exporters';
import type { Vec3 } from '../types';

declare global {
  interface Window {
    __particleCanvas: HTMLCanvasElement | null;
    __particleRenderer: THREE.WebGLRenderer | null;
    __particleScene: THREE.Scene | null;
    __particleCamera: THREE.PerspectiveCamera | null;
    __getParticleSceneAndCamera: () => { scene: THREE.Scene; camera: THREE.Camera } | null;
  }
}

export interface Viewport3DHandle {
  canvas: HTMLCanvasElement | null;
  renderer: THREE.WebGLRenderer | null;
  getScene: () => THREE.Scene | null;
  getCamera: () => THREE.PerspectiveCamera | null;
}

interface Viewport3DProps {
  className?: string;
}

const Viewport3D = forwardRef<Viewport3DHandle, Viewport3DProps>(({ className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const particleEngineRef = useRef<ParticleEngine | null>(null);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: 0 });

  const project = useEditorStore((s) => s.project);
  const activeEmitterId = useEditorStore((s) => s.activeEmitterId);
  const addAttractor = useEditorStore((s) => s.addAttractor);
  const setFps = useEditorStore((s) => s.setFps);
  const setParticleCount = useEditorStore((s) => s.setParticleCount);
  const [displayFps, setDisplayFps] = useState(0);
  const [displayParticleCount, setDisplayParticleCount] = useState(0);

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
    renderer: rendererRef.current,
    getScene: () => sceneRef.current,
    getCamera: () => cameraRef.current,
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070814);
    scene.fog = new THREE.FogExp2(0x070814, 0.05);
    sceneRef.current = scene;

    const { clientWidth, clientHeight } = container;
    const camera = new THREE.PerspectiveCamera(60, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x22d3ee, 1, 50);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xfb923c, 0.8, 50);
    pointLight2.position.set(-5, 3, -5);
    scene.add(pointLight2);

    const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.6;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.8,
      0.5,
      0.6
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);
    composerRef.current = composer;

    const particleEngine = new ParticleEngine();
    particleEngine.attachTo(scene);
    particleEngine.applyProjectConfig(project);
    particleEngineRef.current = particleEngine;

    window.__particleCanvas = canvas;
    window.__particleRenderer = renderer;
    window.__particleScene = scene;
    window.__particleCamera = camera;
    window.__getParticleSceneAndCamera = () => {
      if (sceneRef.current && cameraRef.current) {
        return { scene: sceneRef.current, camera: cameraRef.current };
      }
      return null;
    };
    setViewportRefs(canvas, renderer, scene, camera);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const handleClick = (event: MouseEvent) => {
      if (!container || !camera) return;
      if (event.target !== canvas) return;

      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersectPoint);

      if (intersectPoint) {
        const attractorPos: Vec3 = {
          x: intersectPoint.x,
          y: intersectPoint.y,
          z: intersectPoint.z,
        };
        addAttractor(attractorPos);
      }
    };

    canvas.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container || !camera || !renderer || !composer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);

      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.05) : 0.016;
      lastTimeRef.current = time;

      fpsCounterRef.current.frames++;
      if (time - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        setDisplayFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = time;
      }

      controls.update();

      if (particleEngineRef.current) {
        particleEngineRef.current.update(dt, project.globalGravity, project.globalWind);
        const pc = particleEngineRef.current.getActiveParticleCount();
        setParticleCount(pc);
        setDisplayParticleCount(pc);
      }

      composer.render();
    };

    fpsCounterRef.current.lastTime = performance.now();
    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);

      window.__particleCanvas = null;
      window.__particleRenderer = null;
      window.__particleScene = null;
      window.__particleCamera = null;
      window.__getParticleSceneAndCamera = () => null;
      setViewportRefs(null, null, null, null);

      if (particleEngineRef.current) {
        particleEngineRef.current.dispose();
        particleEngineRef.current = null;
      }

      controls.dispose();
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        const material = (obj as THREE.Mesh).material;
        if (material) {
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            (material as THREE.Material).dispose();
          }
        }
      });

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      composerRef.current = null;
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (particleEngineRef.current) {
      particleEngineRef.current.applyProjectConfig(project);
    }
  }, [project.emitters.length, activeEmitterId, project.attractors.length, project.globalGravity, project.globalWind, project.doCollisions]);

  const prevEmitterIdsRef = useRef<string[]>(project.emitters.map((e) => e.id));
  useEffect(() => {
    const currentIds = project.emitters.map((e) => e.id);
    const prevIds = prevEmitterIdsRef.current;
    const sameIds = currentIds.length === prevIds.length && currentIds.every((id, i) => id === prevIds[i]);
    if (!sameIds) {
      prevEmitterIdsRef.current = currentIds;
      return;
    }
    if (particleEngineRef.current) {
      project.emitters.forEach((emitterConfig) => {
        particleEngineRef.current?.updateEmitterConfig(emitterConfig.id, emitterConfig);
      });
    }
  }, [project]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ''}`} ref={containerRef}>
      <div className="absolute top-3 left-3 z-10 pointer-events-none select-none">
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 space-y-1 border border-slate-700/50">
          <p>🖱️ 左键拖动：旋转视角</p>
          <p>🖱️ 右键拖动：平移视角</p>
          <p>🖱️ 滚轮：缩放</p>
          <p className="text-cyan-400">📍 点击地面：添加吸引子</p>
        </div>
      </div>
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none select-none">
        <div className="bg-slate-900/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 border border-slate-700/50 font-mono">
          <div>FPS: {displayFps}</div>
          <div>Particles: {displayParticleCount}</div>
        </div>
      </div>
    </div>
  );
});

Viewport3D.displayName = 'Viewport3D';

export default Viewport3D;
