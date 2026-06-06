import Toolbar from '@/components/Toolbar';
import EmitterList from '@/components/EmitterList';
import Viewport3D from '@/components/Viewport3D';
import ParamPanel from '@/components/ParamPanel';
import StatusBar from '@/components/StatusBar';

export default function Home() {
  return (
    <div className="w-screen h-screen flex flex-col bg-abyss-950 overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34, 211, 238, 0.12), transparent 60%), radial-gradient(ellipse 60% 60% at 80% 100%, rgba(167, 139, 250, 0.08), transparent 60%), radial-gradient(ellipse 40% 40% at 10% 60%, rgba(251, 146, 60, 0.05), transparent 60%)',
        }}
      />

      <header className="relative z-30">
        <Toolbar />
      </header>

      <main className="relative z-0 flex-1 flex min-h-0">
        <aside className="w-64 flex-shrink-0 border-r border-white/[0.06] glass-panel overflow-y-auto relative z-10">
          <EmitterList />
        </aside>

        <section className="flex-1 relative min-w-0 z-0">
          <Viewport3D />
        </section>

        <aside className="w-80 flex-shrink-0 border-l border-white/[0.06] glass-panel overflow-y-auto relative z-10">
          <ParamPanel />
        </aside>
      </main>

      <footer className="relative z-20">
        <StatusBar />
      </footer>
    </div>
  );
}
