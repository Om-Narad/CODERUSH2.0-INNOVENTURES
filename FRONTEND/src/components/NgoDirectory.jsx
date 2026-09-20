import React, { useState } from 'react';
import { NAGPUR_NGOS } from '../data/mockData';
import {
  Heart,
  Search,
  PhoneCall,
  User,
  MapPin,
  CheckCircle2,
  Building,
  Filter,
} from 'lucide-react';

export default function NgoDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Rescue, Food & Shelter',
    'Medical Help & Relief Kits',
    'Evacuation & Rescue Volunteers',
    'Hot Meals & Ration Supply',
    'Emergency Medical & Blood Bank',
    'Sanitation & Shelter Support',
    'Road Traffic & Route Guidance',
  ];

  const filteredNgos = NAGPUR_NGOS.filter((ngo) => {
    const matchesCategory =
      selectedCategory === 'All' || ngo.category === selectedCategory;

    const matchesSearch =
      searchQuery === '' ||
      ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.coverageWards.some((w) =>
        w.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      ngo.services.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCategory && matchesSearch;
  });

  const handleCall = (number) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 font-sans">
      {/* ─── Header & Top Search Bar ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex-shrink-0">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Nagpur Disaster Relief NGOs Directory
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
                7 VERIFIED RELIEF ORGANIZATIONS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active non-profit organizations providing flood rescue, medical assistance, food distribution &amp; shelter setup across Nagpur Wards
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full lg:w-80 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NGO, ward, or service..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* ─── Category Filter Pills ────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ─── NGO Cards Grid (2 Columns) ──────────────────────────────────── */}
      {filteredNgos.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          No matching NGOs or services found for "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredNgos.map((ngo) => (
            <div
              key={ngo.id}
              className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
            >
              <div>
                {/* Category Badge */}
                <div className="mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
                    {ngo.category}
                  </span>
                </div>

                {/* NGO Title */}
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {ngo.name}
                </h3>

                {/* Contact Person & Address */}
                <div className="space-y-1 mt-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Contact: <strong>{ngo.contactPerson}</strong>
                    </span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{ngo.address}</span>
                  </div>
                </div>

                {/* Emergency Services Offered */}
                <div className="mt-3.5 bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1.5">
                  <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    EMERGENCY HELP SERVICES OFFERED:
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 font-medium">
                    {ngo.services.map((srv, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{srv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Coverage Wards */}
                <div className="mt-3 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ACTIVE COVERAGE WARDS:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ngo.coverageWards.map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleCall(ngo.primaryCall)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/20 cursor-pointer transition-all active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {ngo.primaryCall}</span>
                </button>

                {ngo.altCall && (
                  <button
                    onClick={() => handleCall(ngo.altCall)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
                  >
                    <span className="text-slate-400 text-[10px]">Alt:</span>
                    <span>{ngo.altCall}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
