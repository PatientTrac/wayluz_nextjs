'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Image as ImageIcon, Video, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DebugImageIssue = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetProperty, setTargetProperty] = useState(null);
  const [bucketFiles, setBucketFiles] = useState([]);
  const { toast } = useToast();

  const addLog = (message, type = 'info', data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type, data }]);
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
  };

  const clearLogs = () => setLogs([]);

  const runDiagnostics = async () => {
    setLoading(true);
    clearLogs();
    setTargetProperty(null);
    setBucketFiles([]);
    
    addLog('Starting diagnostics...', 'info');

    try {
      // 1. Find Target Property
      addLog('Searching for "The Secure Executive Home in Palestina"...', 'info');
      const { data: properties, error: dbError } = await supabase
        .from('properties')
        .select('*')
        .ilike('name', '%Palestina%');

      if (dbError) {
        addLog('Database query error:', 'error', dbError);
        throw dbError;
      }

      if (properties && properties.length > 0) {
        const prop = properties[0];
        setTargetProperty(prop);
        addLog(`Found property: ${prop.name} (ID: ${prop.id})`, 'success');
        
        // Analyze Videos (Task 1)
        addLog('--- VIDEO DATA ANALYSIS ---', 'info');
        if (!prop.videos) {
            addLog('Videos field is NULL', 'warning');
        } else if (Array.isArray(prop.videos)) {
            addLog(`Videos field is an Array of ${prop.videos.length} items`, 'info');
            prop.videos.forEach((vid, i) => {
                addLog(`Video [${i}]:`, 'info', vid);
                if (vid.youtube_id) addLog(`Video [${i}] has youtube_id: ${vid.youtube_id}`, 'success');
                else if (vid.url) addLog(`Video [${i}] has url: ${vid.url}`, 'success');
                else addLog(`Video [${i}] missing identifiers`, 'error');
            });
        } else {
            addLog(`Videos field is type ${typeof prop.videos} (Not Array)`, 'error', prop.videos);
        }

        // Analyze Images
        addLog('--- IMAGE DATA ANALYSIS ---', 'info');
        if (!prop.images) {
          addLog('Images field is NULL or UNDEFINED', 'error');
        } else if (Array.isArray(prop.images)) {
          addLog(`Images is an Array of length ${prop.images.length}`, 'info');
        } else {
          addLog(`Images field is type ${typeof prop.images} (not array)`, 'warning', prop.images);
        }

      } else {
        addLog('Property "The Secure Executive Home in Palestina" not found.', 'error');
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
          <h1 className="text-3xl font-bold text-yellow-500">Property Data Debugger</h1>
          <div className="flex gap-4">
            <Button onClick={runDiagnostics} disabled={loading} variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20">
              {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Run Diagnostics
            </Button>
          </div>
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

          {/* Details Panel */}
          <div className="space-y-8">
            {/* Target Property Status */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon /> Property Status
              </h2>
              {targetProperty ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                    <span className="text-gray-400">Name:</span>
                    <span>{targetProperty.name}</span>
                    <span className="text-gray-400">ID:</span>
                    <span className="font-mono text-xs">{targetProperty.id}</span>
                    <span className="text-gray-400">Videos:</span>
                    <span className={!targetProperty.videos ? "text-red-500" : "text-green-500"}>
                      {targetProperty.videos ? `${Array.isArray(targetProperty.videos) ? targetProperty.videos.length : 'Unknown Type'} items` : 'NULL'}
                    </span>
                  </div>
                  
                  {targetProperty.videos && Array.isArray(targetProperty.videos) && (
                     <div className="mt-4">
                       <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                         <Video size={16} /> Video Data
                       </h3>
                       <div className="bg-black p-2 rounded text-xs font-mono overflow-auto max-h-60">
                         <pre>{JSON.stringify(targetProperty.videos, null, 2)}</pre>
                       </div>
                     </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <AlertTriangle className="mx-auto mb-2 opacity-50" />
                  No property data found. Run diagnostics.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugImageIssue;