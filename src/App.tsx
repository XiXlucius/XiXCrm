import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import Sidebar, { type NavTab } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientsView from './components/ClientsView';
import PipelineView from './components/PipelineView';
import TasksView from './components/TasksView';
import { Settings, Loader2 } from 'lucide-react';
import { useState } from 'react';

function parseOobCode(): { mode: string; oobCode: string } | null {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  if (mode && oobCode) return { mode, oobCode };
  const hash = window.location.hash.slice(1);
  const hashParams = new URLSearchParams(hash);
  const hashType = hashParams.get('type');
  const hashToken = hashParams.get('access_token');
  if (hashType === 'recovery' && hashToken) return { mode: 'resetPassword', oobCode: hashToken };
  return null;
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={activeTab} onNavigate={setActiveTab} />
      <main className="flex-1 min-w-0 overflow-hidden">
        {activeTab === 'dashboard'  && <Dashboard />}
        {activeTab === 'clients'    && <ClientsView />}
        {activeTab === 'pipeline'   && <PipelineView />}
        {activeTab === 'tasks'      && <TasksView />}
        {activeTab === 'settings'   && (
          <div className="h-full flex items-center justify-center animate-fade-in">
            <div className="glass-card p-8 text-center max-w-sm w-full">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/06 mb-4">
                <Settings size={24} className="text-metal-400" />
              </div>
              <p className="font-display font-semibold text-white">Configuración</p>
              <p className="text-sm text-metal-500 mt-1">Próximamente disponible</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AppInner() {
  const { user, loading } = useAuth();
  const oob = parseOobCode();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 grid place-items-center shadow-glow-cyan mb-4">
            <Loader2 size={22} className="text-white animate-spin" />
          </div>
          <p className="text-sm text-metal-500 animate-pulse">Cargando XiX Tech...</p>
        </div>
      </div>
    );
  }

  if (oob?.mode === 'resetPassword') return <ResetPasswordScreen oobCode={oob.oobCode} />;
  if (!user) return <AuthScreen />;
  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
