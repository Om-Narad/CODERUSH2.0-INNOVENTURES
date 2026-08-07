import React from 'react';
import StatCards from './StatCards';
import PriorityActionFeed from './PriorityActionFeed';
import MiniPreviewMap from './MiniPreviewMap';
import AlertsLog from './AlertsLog';
import ResourceTable from './ResourceTable';
import FloodDetector from './FloodDetector';

export default function DashboardView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Row: 4 Stat Cards */}
      <StatCards />

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT Column (40% width -> 5 cols in 12-grid) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
          <PriorityActionFeed />
        </div>

        {/* CENTER Column (35% width -> 4 cols in 12-grid) */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
          <MiniPreviewMap />
        </div>

        {/* RIGHT Column (25% width -> 3 cols in 12-grid) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[500px]">
          <AlertsLog />
        </div>

      </div>

      {/* Bottom: Resource Allocation Table */}
      <ResourceTable />

      {/* AI Flood Detection Panel */}
      <FloodDetector />

    </div>
  );
}

