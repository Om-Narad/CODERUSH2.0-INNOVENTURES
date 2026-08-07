import React from 'react';
import { SentinelProvider, useSentinel } from './context/SentinelContext';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import FullMapView from './components/FullMapView';
import SOSAlertsPanel from './components/SOSAlertsPanel';

function MainContent() {
  const { currentView } = useSentinel();

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'map' && <FullMapView />}
        {currentView === 'sos' && <SOSAlertsPanel />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SentinelProvider>
      <MainContent />
    </SentinelProvider>
  );
}
