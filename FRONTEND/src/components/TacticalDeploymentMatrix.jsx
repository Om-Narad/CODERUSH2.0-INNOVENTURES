import React, { useState } from 'react';
import { TACTICAL_DEPLOYMENT_MATRIX } from '../data/mockData';
import {
  ShieldCheck,
  Users,
  Home,
  ShieldAlert,
  UserCheck,
  Clock,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function TacticalDeploymentMatrix() {
  const [matrixData, setMatrixData] = useState(TACTICAL_DEPLOYMENT_MATRIX);

  const toggleDeployment = (id) => {
    setMatrixData((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const isDeployed = row.status === 'Squad Deployed';
          return {
            ...row,
            status: isDeployed ? 'Standby (Pending)' : 'Squad Deployed',
          };
        }
        return row;
      })
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* ─── Header & Legend ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Resource &amp; Tactical Deployment Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tactical Squad Assignments &amp; Evacuation Shelter Tracking
            </p>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center space-x-3 text-xs font-semibold self-start md:self-auto">
          <span className="flex items-center space-x-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Critical Zone</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Warning Zone</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Stable Zone</span>
          </span>
        </div>
      </div>

      {/* ─── Matrix Table ────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-xl">ZONE NAME</th>
              <th className="py-3 px-4">PEOPLE EXPOSED</th>
              <th className="py-3 px-4">ASSIGNED RESPONDER SQUAD</th>
              <th className="py-3 px-4">ASSIGNED EVACUATION SHELTER</th>
              <th className="py-3 px-4">DEPLOYMENT STATUS</th>
              <th className="py-3 px-4 text-right rounded-r-xl">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {matrixData.map((row) => {
              const isDeployed = row.status === 'Squad Deployed';
              const isRed = row.severity === 'red';
              const isAmber = row.severity === 'amber';

              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Zone Name */}
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isRed
                            ? 'bg-rose-500'
                            : isAmber
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span>{row.zoneName}</span>
                    </div>
                  </td>

                  {/* People Exposed */}
                  <td className="py-3.5 px-4 text-slate-600 font-mono-numeric">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong>{row.peopleExposed.toLocaleString()}</strong> evacuees
                      </span>
                    </div>
                  </td>

                  {/* Assigned Responder Squad */}
                  <td className="py-3.5 px-4 text-cyan-800 font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                      <span>
                        {row.assignedSquad}{' '}
                        <span className="text-cyan-600 text-[11px] font-normal">
                          ({row.unitsCount} Units)
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Assigned Evacuation Shelter */}
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Home className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      <span>{row.assignedShelter}</span>
                    </div>
                  </td>

                  {/* Deployment Status */}
                  <td className="py-3.5 px-4">
                    {isDeployed ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Squad Deployed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Standby (Pending)</span>
                      </span>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleDeployment(row.id)}
                      className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${
                        isDeployed
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                      }`}
                    >
                      {isDeployed ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          <span>Recall Squad</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          <span>Deploy Squad</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
