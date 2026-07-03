'use client';

import React, { useState, useRef } from 'react';
import { useApiStore, RequestModel } from '@/store/useApiStore';
import { resolveVariables } from '@/utils/variableResolver';
import { nekoAlert } from '@/lib/alert';

interface ExecutionResult {
  index: number;
  status: number;
  time: number;
  success: boolean;
  error?: string;
}

export default function RunnerEngine() {
  const { collections, environments, activeEnvironmentId } = useApiStore();
  const [selectedColId, setSelectedColId] = useState<string>('');
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [iterations, setIterations] = useState<number>(1);
  const [delay, setDelay] = useState<number>(0);
  const [parallel, setParallel] = useState<boolean>(false);
  
  const [csvData, setCsvData] = useState<Record<string, unknown>[]>([]);
  const [executing, setExecuting] = useState<boolean>(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCollection = collections.find(c => c.id === selectedColId);
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);

  // Parse custom parameters file import
  const parseFileContent = (text: string, fileName: string) => {
    try {
      if (fileName.endsWith('.json')) {
        const parsed = JSON.parse(text);
        setCsvData(Array.isArray(parsed) ? parsed : [parsed]);
      } else {
        // Fallback parser for CSV rows
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(row => {
          const values = row.split(',');
          return headers.reduce((acc, header, idx) => {
            acc[header.trim()] = values[idx]?.trim() || '';
            return acc;
          }, {} as Record<string, string>);
        });
        setCsvData(data);
      }
    } catch {
      nekoAlert('Parse Error', 'Could not parse imported data file. Ensure it is correct JSON or CSV.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      parseFileContent(event.target?.result as string, file.name);
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        parseFileContent(event.target?.result as string, file.name);
      };
      reader.readAsText(file);
    } else {
      nekoAlert('Invalid File', 'Invalid file format. Please drop a .csv or .json file.', 'warning');
    }
  };

  const clearUploadedFile = () => {
    setCsvData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runRequest = async (index: number, templateReq: RequestModel, contextVars: Record<string, unknown>): Promise<ExecutionResult> => {
    const combinedVariables = [
      ...(activeEnv ? activeEnv.variables : []),
      ...Object.entries(contextVars).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value: String(value),
        enabled: true
      }))
    ];

    const rawUrl = templateReq.url;
    const resolvedUrl = resolveVariables(rawUrl, combinedVariables);
    
    try {
      // Extract and append Enabled Query Params
      const urlObj = new URL(resolvedUrl.startsWith('http') ? resolvedUrl : `http://${resolvedUrl}`);
      templateReq.params.forEach(p => {
        if (p.enabled && p.key) {
          urlObj.searchParams.append(p.key, resolveVariables(p.value, combinedVariables));
        }
      });

      const headerMap: Record<string, string> = {};
      templateReq.headers.forEach(h => {
        if (h.enabled && h.key) {
          headerMap[h.key] = resolveVariables(h.value, combinedVariables);
        }
      });

      // Apply Auth configurations
      if (templateReq.auth.type === 'bearer' && templateReq.auth.bearerToken) {
        headerMap['Authorization'] = `Bearer ${resolveVariables(templateReq.auth.bearerToken, combinedVariables)}`;
      } else if (templateReq.auth.type === 'basic' && templateReq.auth.basicUsername) {
        const username = resolveVariables(templateReq.auth.basicUsername, combinedVariables);
        const password = templateReq.auth.basicPassword ? resolveVariables(templateReq.auth.basicPassword, combinedVariables) : '';
        const credentials = btoa(unescape(encodeURIComponent(`${username}:${password}`)));
        headerMap['Authorization'] = `Basic ${credentials}`;
      }

      const bodyRaw = templateReq.bodyType !== 'none' 
        ? resolveVariables(templateReq.body, combinedVariables) 
        : undefined;

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlObj.toString(),
          method: templateReq.method,
          headers: headerMap,
          body: bodyRaw
        })
      });

      const parsed = await res.json();
      return {
        index,
        status: parsed.status,
        time: parsed.time || 0,
        success: parsed.status >= 200 && parsed.status < 300
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        index,
        status: 0,
        time: 0,
        success: false,
        error: errMsg
      };
    }
  };

  const startExecution = async () => {
    const req = activeCollection?.requests.find(r => r.id === selectedReqId);
    if (!req) return;

    setExecuting(true);
    setResults([]);
    const tempResults: ExecutionResult[] = [];

    const totalRuns = csvData.length > 0 ? csvData.length : iterations;

    if (parallel) {
      // Parallel routing pipeline
      const promises = Array.from({ length: totalRuns }).map(async (_, idx) => {
        const variables = csvData[idx] || {};
        const runRes = await runRequest(idx + 1, req, variables);
        tempResults.push(runRes);
        // Sort results by run index so they list chronologically
        setResults([...tempResults].sort((a, b) => a.index - b.index));
      });
      await Promise.all(promises);
    } else {
      // Sequential processing with optional delay intervals
      for (let i = 0; i < totalRuns; i++) {
        const variables = csvData[i] || {};
        const runRes = await runRequest(i + 1, req, variables);
        tempResults.push(runRes);
        setResults([...tempResults]);
        
        if (delay > 0 && i < totalRuns - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Increment global run statistics in store
    const passed = tempResults.filter(r => r.success).length;
    const failed = tempResults.filter(r => !r.success).length;
    const { incrementPassedRuns, incrementFailedRuns } = useApiStore.getState();
    incrementPassedRuns(passed);
    incrementFailedRuns(failed);

    setExecuting(false);
  };

  const totalRuns = csvData.length > 0 ? csvData.length : iterations;
  const completedRuns = results.length;
  const progressPercent = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  // Stats ledger metrics
  const successfulRuns = results.filter(r => r.success).length;
  const failedRuns = results.filter(r => !r.success).length;
  const successRate = completedRuns > 0 ? Math.round((successfulRuns / completedRuns) * 100) : 0;
  const averageTime = completedRuns > 0 ? Math.round(results.reduce((acc, r) => acc + r.time, 0) / completedRuns) : 0;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 text-sm text-gray-200 select-none pb-12">
      
      {/* Title Header Card */}
      <div className="flex justify-between items-center bg-[#0e1017] p-5 rounded-xl border border-white/[0.04] shadow-md">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Bulk Collection Runner</h2>
          <p className="text-gray-500 text-xs mt-1">Execute automated concurrent requests pipeline, import JSON/CSV parameters, and resolve variables.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xl">
          🚀
        </div>
      </div>

      {/* Grid Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#0e1017] p-5 rounded-xl border border-white/[0.04] shadow-lg">
        
        {/* Collection selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Collection</label>
          <select
            value={selectedColId}
            onChange={(e) => {
              setSelectedColId(e.target.value);
              setSelectedReqId('');
            }}
            className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 p-2.5 rounded-lg text-white text-xs outline-none transition"
          >
            <option value="">-- Select Collection --</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Request Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Request template</label>
          <select
            value={selectedReqId}
            disabled={!selectedColId}
            onChange={(e) => setSelectedReqId(e.target.value)}
            className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 p-2.5 rounded-lg text-white text-xs outline-none transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">-- Select Request --</option>
            {activeCollection?.requests.map(r => (
              <option key={r.id} value={r.id}>{r.method} - {r.name}</option>
            ))}
          </select>
        </div>

        {/* Iteration config */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Iterations count</label>
          <input
            type="number"
            disabled={csvData.length > 0}
            value={iterations}
            onChange={(e) => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 p-2.5 rounded-lg text-white text-xs outline-none transition disabled:opacity-40 disabled:cursor-not-allowed font-mono"
          />
          {csvData.length > 0 && (
            <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mt-0.5">Locked: Bound to variables file row size</span>
          )}
        </div>

        {/* Delay config */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delay step interval (ms)</label>
          <input
            type="number"
            value={delay}
            disabled={parallel}
            onChange={(e) => setDelay(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 p-2.5 rounded-lg text-white text-xs outline-none transition disabled:opacity-40 font-mono"
          />
        </div>

        {/* Drag & Drop File Imports */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Import variables file (.csv / .json)</label>
          
          {csvData.length === 0 ? (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`drop-zone animate-fade-in ${dragActive ? 'active' : ''}`}
            >
              <div className="text-2xl mb-2">📁</div>
              <p className="text-xs font-medium text-gray-300">Drag & Drop data files here or <span className="text-violet-400 font-semibold underline decoration-violet-500/40">browse files</span></p>
              <p className="text-[10px] text-gray-600 mt-1">Accepts comma-separated tables (.csv) or structures array (.json)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg border border-violet-500/20 bg-violet-950/10 animate-slide-down">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-violet-300">Variables File Loaded</span>
                  <span className="text-[10px] text-gray-500">{csvData.length} records mapped inside memory</span>
                </div>
              </div>
              <button
                onClick={clearUploadedFile}
                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 border border-rose-950 px-2.5 py-1 rounded-md bg-rose-950/20 transition"
              >
                Clear File
              </button>
            </div>
          )}
        </div>

        {/* Parallel switch Toggle switch */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 md:col-span-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-300">Parallel Execution Pipeline</span>
            <span className="text-[10px] text-gray-500">Dispatch target requests concurrently instead of queuing sequentially</span>
          </div>
          <input
            type="checkbox"
            id="parallel"
            checked={parallel}
            onChange={(e) => {
              setParallel(e.target.checked);
              if (e.target.checked) setDelay(0); // Clear delay if parallel
            }}
            className="toggle-switch"
          />
        </div>
      </div>

      {/* Dispatch Action Trigger Button */}
      <button
        onClick={startExecution}
        disabled={executing || !selectedReqId}
        className="btn-primary w-full py-3.5 text-sm uppercase tracking-wider font-extrabold flex items-center justify-center gap-3 shadow-md"
      >
        {executing ? (
          <>
            <div className="spinner" />
            <span>Executing Batch Pipeline ({progressPercent}%)</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Start Execution Run</span>
          </>
        )}
      </button>

      {/* Progress metrics and stats ledger */}
      {completedRuns > 0 && (
        <div className="flex flex-col gap-4 bg-[#0e1017] p-5 rounded-xl border border-white/[0.04] shadow-lg animate-fade-up">
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Execution Progress</span>
            <span className="text-xs font-mono font-bold text-violet-400">{completedRuns} / {totalRuns} Runs</span>
          </div>

          {/* Glowing animated progress fill */}
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Dynamic summary stats indicators */}
          <div className="grid grid-cols-4 gap-4 mt-2">
            <div className="bg-[#11131c] border border-white/[0.04] p-3 rounded-lg flex flex-col text-center">
              <span className="text-[9px] uppercase font-bold text-gray-500">Success Rate</span>
              <span className="text-base font-extrabold text-emerald-400 mt-1 font-mono">{successRate}%</span>
            </div>
            <div className="bg-[#11131c] border border-white/[0.04] p-3 rounded-lg flex flex-col text-center">
              <span className="text-[9px] uppercase font-bold text-gray-500">Average Latency</span>
              <span className="text-base font-extrabold text-amber-400 mt-1 font-mono">{averageTime} ms</span>
            </div>
            <div className="bg-[#11131c] border border-white/[0.04] p-3 rounded-lg flex flex-col text-center">
              <span className="text-[9px] uppercase font-bold text-gray-500">Passed Runs</span>
              <span className="text-base font-extrabold text-emerald-400 mt-1 font-mono">{successfulRuns}</span>
            </div>
            <div className="bg-[#11131c] border border-white/[0.04] p-3 rounded-lg flex flex-col text-center">
              <span className="text-[9px] uppercase font-bold text-gray-500">Failed Runs</span>
              <span className="text-base font-extrabold text-rose-500 mt-1 font-mono">{failedRuns}</span>
            </div>
          </div>

          {/* Results performance ledger */}
          <div className="mt-2 flex flex-col gap-2">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Response Performance Ledger</span>
            <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-xs select-text">
              {results.map((res) => (
                <div key={res.index} className="flex justify-between items-center px-4 py-2.5 rounded-lg border border-white/[0.03] bg-[#090a0f] hover:bg-[#11131c]/60 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-semibold text-[10px]">Run #{res.index}</span>
                    <span className={`method-badge ${res.success ? 'method-get' : 'method-delete'}`}>
                      {res.success ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className={`font-semibold ${res.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {res.status !== 0 ? `HTTP ${res.status}` : 'ERR'}
                    </span>
                    <span className="text-gray-400 text-[11px] min-w-[50px] text-right">{res.time} ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}