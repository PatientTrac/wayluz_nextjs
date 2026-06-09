'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const DebugVideoFormat = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [targetName, setTargetName] = useState('The Secure Executive Home in Palestina');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching property: "${targetName}"...`);
      const { data: properties, error: supError } = await supabase
        .from('properties')
        .select('*')
        .eq('name', targetName);

      if (supError) throw supError;

      if (!properties || properties.length === 0) {
        throw new Error('Property not found');
      }

      setData(properties[0]);
    } catch (err) {
      console.error('Error fetching debug data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTypeColor = (val) => {
    if (Array.isArray(val)) return 'text-blue-400';
    if (val === null) return 'text-gray-500';
    if (typeof val === 'object') return 'text-green-400';
    if (typeof val === 'string') return 'text-orange-400';
    return 'text-white';
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 p-8 pt-24 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" />
            Video Format Debugger
          </h1>
          <Button onClick={fetchData} disabled={loading} variant="outline" className="border-gray-700">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg mb-6 text-red-400">
            Error: {error}
          </div>
        )}

        {data ? (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Target Property</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Name</span>
                  <span className="text-white">{data.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">ID</span>
                  <span className="text-white">{data.id}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-500/20 px-3 py-1 text-xs text-yellow-500 rounded-bl-lg">
                Focus Field
              </div>
              <h2 className="text-xl font-bold text-white mb-4">"videos" Field Analysis</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-black p-4 rounded border border-gray-800">
                  <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">typeof videos</span>
                  <span className="text-lg font-bold text-white">{typeof data.videos}</span>
                </div>
                <div className="bg-black p-4 rounded border border-gray-800">
                  <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Array.isArray()</span>
                  <span className={`text-lg font-bold ${Array.isArray(data.videos) ? 'text-green-500' : 'text-red-500'}`}>
                    {Array.isArray(data.videos).toString()}
                  </span>
                </div>
                <div className="bg-black p-4 rounded border border-gray-800">
                   <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Length/Size</span>
                   <span className="text-lg font-bold text-white">
                     {Array.isArray(data.videos) ? data.videos.length : (data.videos ? '1 (Not Array)' : '0 (Null/Empty)')}
                   </span>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Raw Value (JSON.stringify)</span>
                <pre className="bg-black p-4 rounded border border-gray-800 overflow-x-auto text-sm text-green-400">
                  {JSON.stringify(data.videos, null, 2)}
                </pre>
              </div>

               {/* Deep Inspection if Array */}
               {Array.isArray(data.videos) && data.videos.length > 0 && (
                 <div>
                    <span className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Array Item Inspection</span>
                    <div className="space-y-2">
                        {data.videos.map((item, idx) => (
                            <div key={idx} className="bg-black p-3 rounded border border-gray-800 flex items-center justify-between">
                                <div>
                                    <span className="text-gray-500 mr-2">Index {idx}:</span>
                                    <span className={getTypeColor(item)}>
                                        {typeof item === 'string' ? `"${item}"` : JSON.stringify(item)}
                                    </span>
                                </div>
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                                    Type: {typeof item}
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
               <h2 className="text-xl font-bold text-white mb-4">Full Record Raw Dump</h2>
               <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                 {JSON.stringify(data, null, 2)}
               </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {loading ? 'Analyzing database...' : 'No data loaded.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugVideoFormat;