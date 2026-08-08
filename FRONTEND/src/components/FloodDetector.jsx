import React, { useState, useRef, useCallback } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudUpload,
  ImageIcon,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Waves,
  ScanSearch,
  Cpu,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   FloodDetector — AI-powered flood detection panel
   Uses the trained ResNet-18 model via POST /api/predict
───────────────────────────────────────────────────────────────────────────── */
export default function FloodDetector() {
  const { predictFlood } = useSentinel();

  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'result' | 'error'
  const [result, setResult] = useState(null);   // { label, confidence, flood_probability }
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef(null);

  /* Drag & Drop handlers */
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  /* Run inference */
  const runInference = async () => {
    if (!imageFile) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    try {
      const data = await predictFlood(imageFile);
      setResult(data);
      setStatus('result');
    } catch (err) {
      setErrorMsg(err.message || 'Inference failed. Is the backend running?');
      setStatus('error');
    }
  };

  /* Derived UI values */
  const isFlood    = result?.label === 'Flood';
  const confPct    = result ? Math.round(result.confidence * 100) : 0;
  const floodPct   = result ? Math.round(result.flood_probability * 100) : 0;
  const noFloodPct = result ? 100 - floodPct : 0;
  const resultBg   = isFlood ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200';
  const resultText = isFlood ? 'text-rose-600' : 'text-emerald-600';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-500">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
              AI Flood Detector
            </h2>
            <p className="text-[11px] text-slate-500">
              ResNet-18 · flood_resnet18.pth · Upload satellite / aerial imagery
            </p>
          </div>
        </div>
        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200 uppercase tracking-wider">
          <Waves className="w-3 h-3" />
          <span>ML Inference</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT: Upload zone */}
        <div className="flex flex-col space-y-3">

          {/* Drop zone */}
          <div
            id="flood-detector-dropzone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !imagePreviewUrl && inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
              ${dragActive
                ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100 cursor-copy'
                : imagePreviewUrl
                  ? 'border-slate-200 cursor-default'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
              }
            `}
            style={{ minHeight: '200px' }}
          >
            {imagePreviewUrl ? (
              <div className="relative w-full h-full" style={{ minHeight: '200px' }}>
                <img
                  src={imagePreviewUrl}
                  alt="Uploaded preview"
                  className="w-full h-full object-cover rounded-xl"
                  style={{ maxHeight: '240px' }}
                />
                {dragActive && (
                  <div className="absolute inset-0 bg-blue-100/60 flex items-center justify-center rounded-xl">
                    <CloudUpload className="w-10 h-10 text-blue-500" />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center" style={{ minHeight: '200px' }}>
                <div className={`p-4 rounded-2xl mb-3 transition-all ${dragActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <ImageIcon className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {dragActive ? 'Release to upload' : 'Drag & drop an image'}
                </p>
                <p className="text-xs text-slate-400 mt-1">or click to browse · PNG, JPG, WEBP</p>
              </div>
            )}
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="file"
            id="flood-image-input"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />

          {/* File info */}
          {imageFile && (
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <span className="truncate max-w-[200px] text-slate-700 font-medium">{imageFile.name}</span>
              <span>{(imageFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {/* Analyze Button */}
          <motion.button
            id="flood-analyze-btn"
            disabled={!imageFile || status === 'loading'}
            onClick={runInference}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200
              ${!imageFile || status === 'loading'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-200 cursor-pointer'
              }
            `}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Inference…</span>
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                <span>Analyze for Flood</span>
              </>
            )}
          </motion.button>
        </div>

        {/* RIGHT: Result panel */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">

            {/* Idle */}
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center py-10 space-y-3"
              >
                <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200">
                  <Waves className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">No prediction yet</p>
                  <p className="text-xs text-slate-400 mt-1">Upload an image and click "Analyze"</p>
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-10 space-y-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-blue-200 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-600">Processing image…</p>
                  <p className="text-xs text-slate-400 mt-1">ResNet-18 forward pass</p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-8 space-y-3 text-center"
              >
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-600">Inference Failed</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">{errorMsg}</p>
                </div>
                <button
                  onClick={runInference}
                  className="text-xs text-blue-500 underline hover:text-blue-700 cursor-pointer"
                >
                  Retry
                </button>
              </motion.div>
            )}

            {/* Result */}
            {status === 'result' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Verdict badge */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${resultBg}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${isFlood ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                      {isFlood
                        ? <Waves className="w-6 h-6 text-rose-600" />
                        : <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      }
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Detection Result
                      </p>
                      <p className={`text-2xl font-extrabold ${resultText}`}>
                        {result.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</p>
                    <p className={`text-3xl font-extrabold font-mono ${resultText}`}>
                      {confPct}%
                    </p>
                  </div>
                </div>

                {/* Probability bars */}
                <div className="space-y-2.5 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-3">
                    Class Probabilities
                  </p>

                  {/* Flood bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-rose-600 font-semibold flex items-center space-x-1">
                        <Waves className="w-3 h-3" /><span>Flood</span>
                      </span>
                      <span className="text-slate-600 font-mono">{floodPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-rose-600 to-red-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${floodPct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* No Flood bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" /><span>No Flood</span>
                      </span>
                      <span className="text-slate-600 font-mono">{noFloodPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-green-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${noFloodPct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Analyze another */}
                <button
                  id="flood-clear-btn"
                  onClick={clearImage}
                  className="w-full py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Upload Another Image
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
