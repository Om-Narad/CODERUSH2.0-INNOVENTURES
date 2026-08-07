import React from 'react';
import { SentinelProvider, useSentinel } from './context/SentinelContext';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import FullMapView from './components/FullMapView';
import SOSAlertsPanel from './components/SOSAlertsPanel';

function MainContent() {
  const { currentView } = useSentinel();

  return (
    // PRODUCTION FIX: Use h-screen instead of min-h-screen so the map view
    // gets a fixed, known height — prevents MapLibre container from being 0px tall.
    <div className="h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white overflow-hidden">
      <Navbar />
      {/* flex-1 + overflow-hidden gives the map a real computed height to render into */}
      <main className="flex-1 flex flex-col overflow-hidden">
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
