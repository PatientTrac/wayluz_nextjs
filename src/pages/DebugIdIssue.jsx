'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, RefreshCw, Database, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DebugIdIssue = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allProperties, setAllProperties] = useState([]);
  const [targetProperty, setTargetProperty] = useState(null);
  
  const addLog = (message, type = 'info', data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type, data }]);
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
  };

  const clearLogs = () => setLogs([]);

  const runDiagnostics = async () => {
    setLoading(true);
    clearLogs();
    setAllProperties([]);
    setTargetProperty(null);
    
    addLog('Starting ID diagnostics...', 'info');

    try {
      // 1. Fetch All Properties to analyze IDs
      addLog('Fetching ALL properties (id, name)...', 'info');
      const { data: properties, error: listError } = await supabase
        .from('properties')
        .select('id, name');

      if (listError) {
        addLog('Failed to list properties', 'error', listError);
      } else {
        setAllProperties(properties);
        addLog(`Successfully fetched ${properties.length} properties.`, 'success');
        
        // Analyze IDs
        properties.forEach(p => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
            addLog(`Property: "${p.name}"`, 'info', { id: p.id, isUUID });
        });
      }

      // 2. Search specific property
      addLog('Searching for "Palestina" property...', 'info');
      const { data: searchResults, error: searchError } = await supabase
        .from('properties')
        .select('*')
        .ilike('name', '%Palestina%');

      if (searchError) {
        addLog('Search failed', 'error', searchError);
      } else if (searchResults.length > 0) {
        const found = searchResults[0];
        setTargetProperty(found);
        addLog(`FOUND TARGET PROPERTY!`, 'success');
        addLog(`ID: ${found.id}`, 'success');
        addLog(`Name: ${found.name}`, 'info');
        
        // Log Full Data Structure
        addLog('--- FULL DATA DUMP ---', 'info', found);
        addLog('Images Count', 'info', found.images?.length || 0);
        addLog('Videos Count', 'info', found.videos?.length || 0);
      } else {
        addLog('Target property "Palestina" NOT FOUND in database.', 'warning');
      }

      // 3. Check specific ID 1705421234
      addLog('Checking if ID "1705421234" exists...', 'info');
      // Note: If ID column is UUID, this query might fail or return nothing depending on strictness
      try {
        const { data: idCheck, error: idError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', '1705421234'); // This will likely fail if column is UUID

        if (idError) {
             addLog('Querying ID "1705421234" failed (Expected if column is UUID)', 'warning', idError);
        } else if (idCheck && idCheck.length > 0) {
             addLog('ID "1705421234" EXISTS!', 'success', idCheck[0]);
        } else {
             addLog('ID "1705421234" does not exist.', 'info');
        }
      } catch (e) {
         addLog('Exception checking numeric ID', 'error', e.message);
      }

    } catch (err) {
      addLog('Diagnostic failed with exception', 'error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 bg-gray-950 text-white font-mono">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-500">ID & Data Debugger</h1>
          <Button onClick={runDiagnostics} disabled={loading} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500/20">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
            Run Diagnostics
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logs Panel */}
          <div className="bg-black border border-gray-800 rounded-lg p-4 h-[600px] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-black pb-2 border-b border-gray-800">Console Output</h2>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className={`p-2 rounded text-xs border-l-2 ${
                  log.type === 'error' ? 'border-red-500 bg-red-950/30 text-red-300' :
                  log.type === 'warning' ? 'border-yellow-500 bg-yellow-950/30 text-yellow-300' :
                  log.type === 'success' ? 'border-green-500 bg-green-950/30 text-green-300' :
                  'border-blue-500 bg-blue-950/30 text-blue-300'
                }`}>
                  <div className="flex justify-between opacity-50 mb-1">
                    <span>{log.timestamp}</span>
                    <span className="uppercase">{log.type}</span>
                  </div>
                  <div className="font-semibold">{log.message}</div>
                  {log.data && (
                    <pre className="mt-2 p-2 bg-black/50 rounded overflow-x-auto text-[10px]">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* List Panel */}
          <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Database /> Database Properties ({allProperties.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-800 text-gray-400">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">ID</th>
                      <th className="p-2">Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {allProperties.map(p => {
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
                        return (
                            <tr key={p.id} className="hover:bg-gray-800/50">
                                <td className="p-2 font-semibold text-white">{p.name}</td>
                                <td className="p-2 font-mono text-gray-400">{p.id}</td>
                                <td className="p-2">
                                    {isUUID ? 
                                        <span className="text-green-500 bg-green-950/30 px-1 rounded">UUID</span> : 
                                        <span className="text-yellow-500 bg-yellow-950/30 px-1 rounded">OTHER</span>
                                    }
                                </td>
                            </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {targetProperty && (
                <div className="bg-gray-900 border border-green-700 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-green-400">Target Property Details</h2>
                    <pre className="text-xs bg-black p-4 rounded overflow-auto max-h-96">
                        {JSON.stringify(targetProperty, null, 2)}
                    </pre>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugIdIssue;