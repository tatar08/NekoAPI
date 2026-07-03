'use client';

import React, { useState } from 'react';
import { RequestModel, useApiStore, KeyValueItem } from '@/store/useApiStore';
import { resolveVariables } from '@/utils/variableResolver';

interface RequestEditorProps {
  request: RequestModel;
}

type EditorTab = 'params' | 'headers' | 'body' | 'auth';

export default function RequestEditor({ request }: RequestEditorProps) {
  const { updateRequest, environments, activeEnvironmentId } = useApiStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('params');
  
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);

  const handleSend = async () => {
    setLoading(true);

    try {
      const rawUrl = request.url;
      const resolvedUrl = activeEnv ? resolveVariables(rawUrl, activeEnv.variables) : rawUrl;

      // Extract Enabled Query Params
      const urlObj = new URL(resolvedUrl.startsWith('http') ? resolvedUrl : `http://${resolvedUrl}`);
      request.params.forEach(p => {
        if (p.enabled && p.key) {
          urlObj.searchParams.append(p.key, activeEnv ? resolveVariables(p.value, activeEnv.variables) : p.value);
        }
      });

      // Construct request headers
      const headerMap: Record<string, string> = {};
      request.headers.forEach(h => {
        if (h.enabled && h.key) {
          headerMap[h.key] = activeEnv ? resolveVariables(h.value, activeEnv.variables) : h.value;
        }
      });

      // Apply Auth configurations
      if (request.auth.type === 'bearer' && request.auth.bearerToken) {
        headerMap['Authorization'] = `Bearer ${activeEnv ? resolveVariables(request.auth.bearerToken, activeEnv.variables) : request.auth.bearerToken}`;
      } else if (request.auth.type === 'basic' && request.auth.basicUsername) {
        const credentials = btoa(`${request.auth.basicUsername}:${request.auth.basicPassword || ''}`);
        headerMap['Authorization'] = `Basic ${credentials}`;
      }

      const proxyPayload = {
        url: urlObj.toString(),
        method: request.method,
        headers: headerMap,
        body: request.bodyType === 'none' ? undefined : request.body
      };

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyPayload),
      });

      const responseData = await res.json();
      updateRequest(request.id, { response: responseData });
    } catch (err: any) {
      updateRequest(request.id, {
        response: {
          status: 0,
          statusText: 'Proxy Transmission Error',
          headers: {},
          data: err.message || err,
          time: 0,
          size: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Add Item to Params/Headers
  const addItem = (type: 'params' | 'headers') => {
    const newItem: KeyValueItem = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true
    };
    updateRequest(request.id, {
      [type]: [...request[type], newItem]
    });
  };

  // Update Item in Params/Headers
  const updateItem = (type: 'params' | 'headers', itemId: string, updates: Partial<KeyValueItem>) => {
    const list = request[type].map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateRequest(request.id, { [type]: list });
  };

  // Delete Item from Params/Headers
  const deleteItem = (type: 'params' | 'headers', itemId: string) => {
    const list = request[type].filter(item => item.id !== itemId);
    updateRequest(request.id, { [type]: list });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-emerald-400 border-emerald-500/20';
      case 'POST': return 'text-blue-400 border-blue-500/20';
      case 'PUT': return 'text-amber-400 border-amber-500/20';
      case 'DELETE': return 'text-rose-400 border-rose-500/20';
      case 'PATCH': return 'text-purple-400 border-purple-500/20';
      default: return 'text-gray-400 border-white/10';
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-[#0e1017] p-4 border border-white/[0.04] rounded-xl shadow-lg select-none">
      
      {/* Endpoint URL Bar with Custom styling */}
      <div className="flex gap-2 relative">
        <select
          value={request.method}
          onChange={(e) => updateRequest(request.id, { method: e.target.value as any })}
          className={`bg-[#11131c] border border-white/[0.06] font-bold text-xs uppercase px-4 py-2.5 rounded-lg outline-none cursor-pointer transition ${getMethodColor(request.method)}`}
        >
          <option value="GET" className="text-emerald-400">GET</option>
          <option value="POST" className="text-blue-400">POST</option>
          <option value="PUT" className="text-amber-400">PUT</option>
          <option value="DELETE" className="text-rose-400">DELETE</option>
          <option value="PATCH" className="text-purple-400">PATCH</option>
        </select>
        
        <input
          type="text"
          value={request.url}
          onChange={(e) => updateRequest(request.id, { url: e.target.value })}
          placeholder="https://api.example.com/endpoint or {{baseUrl}}/users"
          className="flex-1 bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 text-white px-3.5 py-2 rounded-lg text-xs outline-none transition placeholder-gray-600 font-mono"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="btn-primary min-w-[90px] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner" />
              <span>Sending</span>
            </>
          ) : (
            'Send'
          )}
        </button>
      </div>

      {/* Editor Sections Navigation Tabs */}
      <div className="flex border-b border-white/[0.04]">
        <button
          onClick={() => setActiveTab('params')}
          className={`tab-item ${activeTab === 'params' ? 'active' : ''}`}
        >
          Params
          <span className="tab-count">{request.params.filter(p => p.enabled && p.key).length}</span>
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`tab-item ${activeTab === 'headers' ? 'active' : ''}`}
        >
          Headers
          <span className="tab-count">{request.headers.filter(h => h.enabled && h.key).length}</span>
        </button>
        <button
          onClick={() => setActiveTab('body')}
          className={`tab-item ${activeTab === 'body' ? 'active' : ''}`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('auth')}
          className={`tab-item ${activeTab === 'auth' ? 'active' : ''}`}
        >
          Auth
          {request.auth.type !== 'none' && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block ml-1" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[140px] pt-1">
        
        {/* PARAMS TAB */}
        {activeTab === 'params' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Query Parameters</span>
              <button
                onClick={() => addItem('params')}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium px-2 py-1 rounded bg-violet-950/20 border border-violet-900/30 transition"
              >
                + Add Parameter
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
              {request.params.length === 0 && (
                <div className="text-center text-gray-600 text-xs py-6 border border-dashed border-white/[0.04] rounded-lg">
                  No parameters added. They will be appended to the URL query string.
                </div>
              )}
              {request.params.map(param => (
                <div key={param.id} className="flex gap-2 items-center bg-white/[0.005] border border-white/[0.03] p-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateItem('params', param.id, { enabled: e.target.checked })}
                    className="rounded bg-[#090a0f] border-white/[0.1] accent-violet-500 w-3.5 h-3.5"
                  />
                  <input
                    type="text"
                    placeholder="Key"
                    value={param.key}
                    onChange={(e) => updateItem('params', param.id, { key: e.target.value })}
                    className="flex-1 bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1.5 rounded text-white outline-none font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={param.value}
                    onChange={(e) => updateItem('params', param.id, { value: e.target.value })}
                    className="flex-1 bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1.5 rounded text-white outline-none font-mono"
                  />
                  <button
                    onClick={() => deleteItem('params', param.id)}
                    className="text-gray-500 hover:text-rose-400 px-1 text-sm font-bold transition"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HEADERS TAB */}
        {activeTab === 'headers' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Request Headers</span>
              <button
                onClick={() => addItem('headers')}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium px-2 py-1 rounded bg-violet-950/20 border border-violet-900/30 transition"
              >
                + Add Header
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
              {request.headers.length === 0 && (
                <div className="text-center text-gray-600 text-xs py-6 border border-dashed border-white/[0.04] rounded-lg">
                  No custom headers added.
                </div>
              )}
              {request.headers.map(header => (
                <div key={header.id} className="flex gap-2 items-center bg-white/[0.005] border border-white/[0.03] p-1.5 rounded-lg">
                  <input
                    type="checkbox"
                    checked={header.enabled}
                    onChange={(e) => updateItem('headers', header.id, { enabled: e.target.checked })}
                    className="rounded bg-[#090a0f] border-white/[0.1] accent-violet-500 w-3.5 h-3.5"
                  />
                  <input
                    type="text"
                    placeholder="Content-Type"
                    value={header.key}
                    onChange={(e) => updateItem('headers', header.id, { key: e.target.value })}
                    className="flex-1 bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1.5 rounded text-white outline-none font-mono"
                  />
                  <input
                    type="text"
                    placeholder="application/json"
                    value={header.value}
                    onChange={(e) => updateItem('headers', header.id, { value: e.target.value })}
                    className="flex-1 bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1.5 rounded text-white outline-none font-mono"
                  />
                  <button
                    onClick={() => deleteItem('headers', header.id)}
                    className="text-gray-500 hover:text-rose-400 px-1 text-sm font-bold transition"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BODY TAB */}
        {activeTab === 'body' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">JSON Request Payload</span>
              <select
                value={request.bodyType}
                onChange={(e) => updateRequest(request.id, { bodyType: e.target.value as any })}
                className="bg-[#11131c] border border-white/[0.06] text-gray-300 px-2.5 py-1 rounded outline-none text-[11px]"
              >
                <option value="json">JSON</option>
                <option value="none">None</option>
              </select>
            </div>

            {request.bodyType !== 'none' ? (
              <textarea
                rows={6}
                value={request.body}
                onChange={(e) => updateRequest(request.id, { body: e.target.value })}
                placeholder={`{\n  "key": "value"\n}`}
                className="w-full font-mono bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 text-emerald-400 p-3 rounded-lg text-xs outline-none resize-y shadow-inner"
              />
            ) : (
              <div className="text-center text-gray-600 text-xs py-8 border border-dashed border-white/[0.04] rounded-lg">
                No request body payload will be transmitted.
              </div>
            )}
          </div>
        )}

        {/* AUTH TAB */}
        {activeTab === 'auth' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Auth Type</span>
              <select
                value={request.auth.type}
                onChange={(e) => updateRequest(request.id, {
                  auth: { ...request.auth, type: e.target.value as any }
                })}
                className="bg-[#11131c] border border-white/[0.06] text-gray-300 px-2.5 py-1.5 rounded outline-none text-[11px] cursor-pointer"
              >
                <option value="none">Inherit / None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {request.auth.type === 'bearer' && (
              <div className="flex flex-col gap-1.5 animate-slide-down">
                <span className="text-[10px] text-gray-500 font-medium">Token</span>
                <input
                  type="text"
                  placeholder="Bearer Token (supports {{variable}})"
                  value={request.auth.bearerToken || ''}
                  onChange={(e) => updateRequest(request.id, {
                    auth: { ...request.auth, bearerToken: e.target.value }
                  })}
                  className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-3 py-2 rounded-lg text-xs outline-none text-white font-mono"
                />
              </div>
            )}

            {request.auth.type === 'basic' && (
              <div className="grid grid-cols-2 gap-3 animate-slide-down">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 font-medium">Username</span>
                  <input
                    type="text"
                    placeholder="Username"
                    value={request.auth.basicUsername || ''}
                    onChange={(e) => updateRequest(request.id, {
                      auth: { ...request.auth, basicUsername: e.target.value }
                    })}
                    className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-3 py-2 rounded-lg text-xs outline-none text-white font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 font-medium">Password</span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={request.auth.basicPassword || ''}
                    onChange={(e) => updateRequest(request.id, {
                      auth: { ...request.auth, basicPassword: e.target.value }
                    })}
                    className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-3 py-2 rounded-lg text-xs outline-none text-white font-mono"
                  />
                </div>
              </div>
            )}

            {request.auth.type === 'none' && (
              <div className="text-center text-gray-600 text-xs py-6 border border-dashed border-white/[0.04] rounded-lg">
                No authorization credentials attached directly.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}