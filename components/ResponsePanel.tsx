'use client';

import React, { useState } from 'react';
import { RequestModel } from '@/store/useApiStore';

interface ResponsePanelProps {
  request: RequestModel;
}

type ResponseTab = 'body' | 'headers' | 'timeline';

export default function ResponsePanel({ request }: ResponsePanelProps) {
  const { response } = request;
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');
  const [copied, setCopied] = useState(false);

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-16 relative">
        <div className="absolute w-[180px] h-[180px] rounded-full bg-indigo-500/3 blur-[80px] pointer-events-none" />
        <div className="text-4xl mb-3 opacity-30 select-none">📡</div>
        <p className="text-xs font-mono select-none tracking-wide text-gray-400">No response payload generated yet</p>
        <p className="text-[10px] text-gray-600 mt-1 max-w-xs leading-normal">Send the request above to dispatch transmission proxies and inspect remote server results.</p>
      </div>
    );
  }

  const handleCopy = () => {
    const textToCopy = typeof response.data === 'object' 
      ? JSON.stringify(response.data, null, 2) 
      : String(response.data);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuccess = response.status >= 200 && response.status < 300;
  const isRedirect = response.status >= 300 && response.status < 400;
  const isError = response.status >= 400 || response.status === 0;

  const getStatusClass = () => {
    if (isSuccess) return 'status-success animate-pulse-glow';
    if (isRedirect) return 'status-warning';
    return 'status-error';
  };

  return (
    <div className="flex flex-col h-full gap-4 text-xs select-none">
      
      {/* Response Metrics Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 bg-white/[0.005]">
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* Status Badge */}
          <div className={`status-badge ${getStatusClass()}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{response.status} {response.statusText}</span>
          </div>

          {/* Timing Metric */}
          <div className="flex items-center gap-1.5 text-gray-400 bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{response.time} ms</span>
          </div>

          {/* Size Metric */}
          <div className="flex items-center gap-1.5 text-gray-400 bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>{(response.size / 1024).toFixed(2)} KB</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white border border-white/[0.06] hover:border-white/15 px-3 py-1.5 rounded-lg bg-[#11131c] hover:bg-white/[0.06] transition duration-200"
        >
          {copied ? 'Copied!' : 'Copy Payload'}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/[0.04]">
        <button
          onClick={() => setActiveTab('body')}
          className={`tab-item ${activeTab === 'body' ? 'active' : ''}`}
        >
          Response Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`tab-item ${activeTab === 'headers' ? 'active' : ''}`}
        >
          Headers
          <span className="tab-count">{Object.keys(response.headers || {}).length}</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`tab-item ${activeTab === 'timeline' ? 'active' : ''}`}
        >
          Timeline
        </button>
      </div>

      {/* Contents Area */}
      <div className="flex-1 overflow-auto min-h-[200px]">
        
        {/* BODY PANEL (Syntax highlighting with Collapsible Tree) */}
        {activeTab === 'body' && (
          <div className="h-full bg-[#090a0f] p-4 rounded-xl border border-white/[0.04] overflow-auto shadow-inner select-text">
            {typeof response.data === 'object' && response.data !== null ? (
              <JSONNode value={response.data} isLast={true} />
            ) : (
              <pre className="font-mono text-emerald-400 whitespace-pre-wrap select-text leading-relaxed font-medium">
                {String(response.data)}
              </pre>
            )}
          </div>
        )}

        {/* HEADERS PANEL */}
        {activeTab === 'headers' && (
          <div className="flex flex-col border border-white/[0.04] bg-[#0c0d14] rounded-xl overflow-hidden shadow-md animate-fade-in select-text">
            <div className="grid grid-cols-3 bg-white/[0.02] border-b border-white/[0.04] px-4 py-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              <div className="col-span-1">Header Key</div>
              <div className="col-span-2">Value</div>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.03] max-h-80 overflow-y-auto">
              {Object.entries(response.headers || {}).length === 0 && (
                <div className="p-4 text-center text-gray-600 font-medium">No headers returned by target server.</div>
              )}
              {Object.entries(response.headers || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 px-4 py-2.5 font-mono text-[11px]">
                  <div className="col-span-1 text-violet-400 font-semibold truncate pr-2">{key}</div>
                  <div className="col-span-2 text-gray-300 break-all">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE PANEL */}
        {activeTab === 'timeline' && (
          <div className="p-4 bg-[#090a0f] border border-white/[0.04] rounded-xl flex flex-col gap-3 font-mono text-[11px] text-gray-400 animate-fade-in select-text leading-normal">
            <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              <span>Execution Log Ledger</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <span className="text-emerald-500 font-semibold">&gt;</span>
                <span>Connecting to CORS proxy api gateway...</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500 font-semibold">&gt;</span>
                <span>Dispatched request payload to target: <span className="text-violet-400 break-all">{request.url}</span></span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500 font-semibold">&gt;</span>
                <span>Target server resolved in <span className="text-amber-400">{response.time}ms</span></span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500 font-semibold">&gt;</span>
                <span>Response Status Code: <span className={isSuccess ? 'text-emerald-500' : 'text-rose-500'}>{response.status} {response.statusText}</span></span>
              </div>
              <div className="flex gap-2 border-t border-white/[0.04] pt-2 text-gray-500 text-[10px]">
                <span>Connection status: Closed. Payload size: {response.size} bytes.</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   INTELLIGENT NESTED COLLAPSIBLE JSON TREE COMPONENT
   ═══════════════════════════════════════════════════════ */

interface JSONNodeProps {
  value: any;
  label?: string;
  isLast: boolean;
  depth?: number;
}

function JSONNode({ value, label, isLast, depth = 0 }: JSONNodeProps) {
  const [collapsed, setCollapsed] = useState(false);

  const getIndent = () => {
    return { paddingLeft: `${depth * 16}px` };
  };

  const isObject = value !== null && typeof value === 'object';

  if (!isObject) {
    let renderedValue = null;
    let valClass = '';

    if (typeof value === 'string') {
      renderedValue = `"${value}"`;
      valClass = 'json-string';
    } else if (typeof value === 'number') {
      renderedValue = String(value);
      valClass = 'json-number';
    } else if (typeof value === 'boolean') {
      renderedValue = String(value);
      valClass = 'json-boolean';
    } else if (value === null) {
      renderedValue = 'null';
      valClass = 'json-null';
    } else {
      renderedValue = String(value);
    }

    return (
      <div className="font-mono text-[11px] leading-normal py-0.5" style={getIndent()}>
        {label && (
          <>
            <span className="json-key">"{label}"</span>
            <span className="text-gray-500 mr-1.5">:</span>
          </>
        )}
        <span className={valClass}>{renderedValue}</span>
        {!isLast && <span className="text-gray-500">,</span>}
      </div>
    );
  }

  // Value is an Object or Array
  const isArray = Array.isArray(value);
  const keys = Object.keys(value);
  const totalItems = keys.length;

  const openingBracket = isArray ? '[' : '{';
  const closingBracket = isArray ? ']' : '}';

  if (totalItems === 0) {
    return (
      <div className="font-mono text-[11px] py-0.5" style={getIndent()}>
        {label && (
          <>
            <span className="json-key">"{label}"</span>
            <span className="text-gray-500 mr-1.5">:</span>
          </>
        )}
        <span className="json-bracket">{openingBracket}{closingBracket}</span>
        {!isLast && <span className="text-gray-500">,</span>}
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px] leading-normal py-0.5">
      <div style={getIndent()} className="flex items-center select-none">
        
        {/* Toggle switch symbol */}
        <span 
          onClick={() => setCollapsed(!collapsed)}
          className="json-toggle"
        >
          {collapsed ? '▶' : '▼'}
        </span>

        {label && (
          <>
            <span className="json-key">"{label}"</span>
            <span className="text-gray-500 mr-1.5">:</span>
          </>
        )}

        <span className="json-bracket">{openingBracket}</span>
        
        {collapsed && (
          <>
            <span className="text-gray-500 text-[10px] bg-white/[0.04] px-1 rounded-md mx-1 font-semibold hover:bg-white/[0.08] cursor-pointer" onClick={() => setCollapsed(false)}>
              {isArray ? `${totalItems} items` : `${totalItems} keys`}
            </span>
            <span className="json-bracket">{closingBracket}</span>
            {!isLast && <span className="text-gray-500">,</span>}
          </>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="flex flex-col">
            {keys.map((key, idx) => (
              <JSONNode 
                key={key} 
                label={isArray ? undefined : key} 
                value={value[key]} 
                isLast={idx === totalItems - 1} 
                depth={depth + 1}
              />
            ))}
          </div>
          <div style={getIndent()} className="pl-3.5">
            <span className="json-bracket">{closingBracket}</span>
            {!isLast && <span className="text-gray-500">,</span>}
          </div>
        </>
      )}
    </div>
  );
}