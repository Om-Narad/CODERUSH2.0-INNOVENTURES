import React from 'react';
import { SentinelProvider, useSentinel } from './context/SentinelContext';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import FullMapView from './components/FullMapView';
import SOSAlertsPanel from './components/SOSAlertsPanel';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Error Boundary to prevent white/black blank screen crashes
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SentinelPlan Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0f17] text-white text-center space-y-4 min-h-[400px]">
          <div className="p-4 bg-rose-950/60 border border-rose-800/60 rounded-2xl">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Map View Render Notice</h2>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              {this.state.error?.message || 'Component error occurred while rendering Map View.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Map View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        {currentView === 'map' && (
          <MapErrorBoundary>
            <FullMapView />
          </MapErrorBoundary>
        )}
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
