'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Search, Database, FileJson, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { inspectTableSchema, fetchAllPropertiesSummary, fetchPropertyByName } from '@/lib/debugQueries';

const DebugVideoIssue = () => {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [targetProperty, setTargetProperty] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // unknown, connected, error
  const [connectionError, setConnectionError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("The Secure Executive Home in Palestina");
  const [targetId, setTargetId] = useState("1705421234");
  const [idCheckResult, setIdCheckResult] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setConnectionStatus('connecting');
    setConnectionError(null);
    setTargetProperty(null);
    setIdCheckResult(null);

    try {
      // 1. Test Connection & Schema
      const schemaResult = await inspectTableSchema();
      if (schemaResult.success) {
        setSchemaInfo(schemaResult);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        setConnectionError(schemaResult.error.message);
        throw new Error("Connection failed");
      }

      // 2. Fetch All Properties (IDs and Videos)
      const allPropsResult = await fetchAllPropertiesSummary();
      if (allPropsResult.success) {
        setProperties(allPropsResult.data);
        
        // Check for specific ID existence
        const foundById = allPropsResult.data.find(p => p.id === targetId);
        setIdCheckResult(foundById ? { exists: true, data: foundById } : { exists: false });
      }

      // 3. Search for specific property
      const searchResult = await fetchPropertyByName(searchTerm);
      if (searchResult.success && searchResult.data.length > 0) {
        setTargetProperty(searchResult.data[0]);
      }

    } catch (err) {
      console.error("Diagnostics failed:", err);
      if (connectionStatus !== 'error') {
          setConnectionStatus('error');
          setConnectionError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-950 text-white font-mono">
      <div className="container mx-auto max-w-6xl space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
              <Database className="w-8 h-8" />
              Deep Diagnostics: Video Data
            </h1>
            <p className="text-gray-400 mt-2">Analyzing Supabase 'properties' table and video column structure.</p>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Data
          </Button>
        </div>

        {/* Connection Status */}
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Status: 
              {connectionStatus === 'connected' && <span className="text-green-500 flex items-center gap-1"><CheckCircle size={20}/> Connected</span>}
              {connectionStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><XCircle size={20}/> Error</span>}
              {connectionStatus === 'connecting' && <span className="text-yellow-500 flex items-center gap-1"><Loader2 size={20} className="animate-spin"/> Connecting...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionError && (
              <div className="bg-red-950/50 border border-red-900 p-4 rounded text-red-300 mb-4">
                <strong>Error:</strong> {connectionError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <h3 className="font-bold text-gray-400 mb-2">Inferred Schema (First Record):</h3>
                  {schemaInfo && schemaInfo.sample ? (
                    <div className="bg-black p-3 rounded text-xs overflow-auto max-h-40">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="pb-1 text-gray-500">Column</th>
                            <th className="pb-1 text-gray-500">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(schemaInfo.types).map(([key, type]) => (
                            <tr key={key}>
                              <td className="py-1 text-blue-300">{key}</td>
                              <td className="py-1 text-green-300">{type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="text-gray-500 italic">No data available to infer schema.</div>}
               </div>
               <div>
                  <h3 className="font-bold text-gray-400 mb-2">Target ID Check ({targetId}):</h3>
                  {idCheckResult ? (
                    idCheckResult.exists ? (
                      <div className="bg-green-950/30 border border-green-900 p-3 rounded text-green-400 flex items-center gap-2">
                        <CheckCircle size={16} /> ID Exists in Database
                      </div>
                    ) : (
                      <div className="bg-red-950/30 border border-red-900 p-3 rounded text-red-400 flex items-center gap-2">
                        <XCircle size={16} /> ID NOT Found
                      </div>
                    )
                  ) : <div className="text-gray-500">Checking...</div>}
                  
                  <h3 className="font-bold text-gray-400 mt-4 mb-2">Total Properties:</h3>
                  <div className="text-2xl font-bold">{properties.length}</div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Property Analysis */}
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
             <CardTitle className="flex items-center justify-between">
                <span>Target Property Analysis</span>
                <div className="flex items-center gap-2">
                   <Input 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="bg-black border-gray-700 text-white w-64 h-8 text-sm"
                    />
                   <Button size="sm" variant="outline" onClick={runDiagnostics}><Search size={14}/></Button>
                </div>
             </CardTitle>
             <CardDescription className="text-gray-400">
               Searching for name containing: "{searchTerm}"
             </CardDescription>
          </CardHeader>
          <CardContent>
            {targetProperty ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-black border border-gray-800 rounded">
                    <span className="block text-xs text-gray-500 uppercase">ID</span>
                    <span className="text-sm font-bold text-yellow-500 break-all">{targetProperty.id}</span>
                  </div>
                  <div className="p-3 bg-black border border-gray-800 rounded">
                    <span className="block text-xs text-gray-500 uppercase">Name</span>
                    <span className="text-sm font-bold text-white">{targetProperty.name}</span>
                  </div>
                  <div className="p-3 bg-black border border-gray-800 rounded">
                    <span className="block text-xs text-gray-500 uppercase">Videos Column Type</span>
                    <span className={`text-sm font-bold ${Array.isArray(targetProperty.videos) ? 'text-green-400' : 'text-orange-400'}`}>
                      {targetProperty.videos === null ? 'NULL' : (Array.isArray(targetProperty.videos) ? `Array (${targetProperty.videos.length})` : typeof targetProperty.videos)}
                    </span>
                  </div>
                </div>

                <div>
                   <h3 className="font-bold text-gray-400 mb-2 flex items-center gap-2"><FileJson size={16}/> Raw Video Data</h3>
                   <div className="bg-black p-4 rounded border border-gray-800 font-mono text-xs overflow-auto max-h-96">
                     <pre className="text-green-400">{JSON.stringify(targetProperty.videos, null, 2)}</pre>
                   </div>
                </div>

                <div>
                   <h3 className="font-bold text-gray-400 mb-2 flex items-center gap-2"><FileJson size={16}/> Complete Record</h3>
                   <div className="bg-black p-4 rounded border border-gray-800 font-mono text-xs overflow-auto max-h-60 opacity-70 hover:opacity-100 transition-opacity">
                     <pre className="text-blue-300">{JSON.stringify(targetProperty, null, 2)}</pre>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 bg-black/20 rounded border border-dashed border-gray-800">
                Property not found matching "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Properties List */}
        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader>
            <CardTitle>All Properties Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black text-gray-400">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Videos Type</th>
                    <th className="p-3">Videos Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {properties.map(p => (
                    <tr key={p.id} className="hover:bg-gray-800/50">
                      <td className="p-3 font-mono text-xs text-yellow-600/70">{p.id}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 font-mono text-xs">
                         {p.videos === null ? <span className="text-gray-600">null</span> : 
                          (Array.isArray(p.videos) ? <span className="text-green-500">Array</span> : <span className="text-orange-500">{typeof p.videos}</span>)}
                      </td>
                      <td className="p-3">
                        {Array.isArray(p.videos) ? p.videos.length : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DebugVideoIssue;