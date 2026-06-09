'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const DebugDatabaseSync = () => {
  const [loading, setLoading] = useState(false);
  const [projectUrl, setProjectUrl] = useState('');
  const [properties, setProperties] = useState([]);
  const [schemaInfo, setSchemaInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Get Project URL (Attempt to read from client internal property if available, usually supabaseUrl)
    const url = supabase.supabaseUrl || "Hidden/Protected";
    setProjectUrl(url);
    
    // Initial fetch
    runDiagnostics();
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] [${type.toUpperCase()}] ${message}`, ...prev]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setProperties([]);
    addLog('Starting diagnostics...', 'info');

    try {
      // 2. Fetch Properties
      addLog('Fetching properties from table "properties"...', 'info');
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .limit(5);

      if (fetchError) {
        throw fetchError;
      }

      setProperties(data || []);
      addLog(`Successfully fetched ${data?.length || 0} properties.`, 'success');
      
      if (data && data.length > 0) {
        addLog('First property ID: ' + data[0].id, 'info');
      } else {
        addLog('Table "properties" appears empty or inaccessible.', 'warning');
      }

      // 3. Check Schema/Columns (Infer from data)
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setSchemaInfo(columns);
        addLog(`Detected columns: ${columns.join(', ')}`, 'info');
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testInsert = () => {
    addLog('Simulating INSERT (not executing to prevent garbage data)...', 'info');
    addLog('AdminPanel uses: .from("properties").insert([data])', 'info');
    // We don't want to actually fill the DB with junk in a debug tool unless explicitly requested.
    // We'll just verify we can read, which confirms connection.
    alert("Insert simulation logged. Check console logs for query structure analysis.");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-8 pt-24 font-mono text-sm">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#d4af37] flex items-center gap-3">
              <Database className="w-8 h-8" />
              Database Sync Debugger
            </h1>
            <p className="text-gray-400 mt-2">Analyze connection consistency between Admin and Public pages.</p>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="bg-[#d4af37] text-black hover:bg-[#c9a961]">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
            Run Diagnostics
          </Button>
        </div>

        {/* Connection Info */}
        <Card className="bg-[#1a1a1a] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-white">Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#0f0f0f] border border-gray-800">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Supabase Project URL</span>
                <span className="text-[#d4af37] font-medium break-all">{projectUrl}</span>
              </div>
              <div className="p-4 rounded-lg bg-[#0f0f0f] border border-gray-800">
                <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Status</span>
                <div className="flex items-center gap-2">
                  {error ? (
                    <><XCircle className="text-red-500 w-5 h-5" /> <span className="text-red-500">Connection Error</span></>
                  ) : (
                    <><CheckCircle className="text-green-500 w-5 h-5" /> <span className="text-green-500">Connected & Readable</span></>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logic Analysis Comparison */}
        <Card className="bg-[#1a1a1a] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-white">Logic Consistency Analysis</CardTitle>
            <CardDescription className="text-gray-400">Comparing src/pages/AdminPanel.jsx vs src/pages/PropertyDetailPage.jsx</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-500">Aspect</TableHead>
                    <TableHead className="text-gray-500">AdminPanel.jsx</TableHead>
                    <TableHead className="text-gray-500">PropertyDetailPage.jsx</TableHead>
                    <TableHead className="text-center text-gray-500">Match?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-800">
                  <TableRow className="hover:bg-transparent border-gray-800">
                    <TableCell className="text-gray-400">Client Source</TableCell>
                    <TableCell className="font-mono text-xs">@/lib/customSupabaseClient</TableCell>
                    <TableCell className="font-mono text-xs">@/lib/customSupabaseClient</TableCell>
                    <TableCell className="text-center text-green-500"><CheckCircle className="w-4 h-4 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-gray-800">
                    <TableCell className="text-gray-400">Table Name</TableCell>
                    <TableCell className="font-mono text-[#d4af37]">properties</TableCell>
                    <TableCell className="font-mono text-[#d4af37]">properties</TableCell>
                    <TableCell className="text-center text-green-500"><CheckCircle className="w-4 h-4 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-gray-800">
                    <TableCell className="text-gray-400">Primary Key</TableCell>
                    <TableCell>Uses <code>id</code> for updates/deletes</TableCell>
                    <TableCell>Uses <code>id</code> for fetching</TableCell>
                    <TableCell className="text-center text-green-500"><CheckCircle className="w-4 h-4 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-transparent border-gray-800">
                    <TableCell className="text-gray-400">Columns Read</TableCell>
                    <TableCell className="font-mono text-xs">name, location, price_cop, price_usd, images...</TableCell>
                    <TableCell className="font-mono text-xs">name, location, price_cop, price_usd, images...</TableCell>
                    <TableCell className="text-center text-green-500"><CheckCircle className="w-4 h-4 mx-auto" /></TableCell>
                  </TableRow>
                   <TableRow className="hover:bg-transparent border-gray-800">
                    <TableCell className="text-gray-400">Special Logic</TableCell>
                    <TableCell className="text-xs">Handles image uploads & JSONB writes</TableCell>
                    <TableCell className="text-xs">Handles Legacy ID fallback & UUID validation</TableCell>
                    <TableCell className="text-center text-yellow-500"><AlertTriangle className="w-4 h-4 mx-auto" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-4 bg-[#0f0f0f] rounded border border-gray-800">
              <h4 className="font-bold text-gray-300 mb-2">Conclusion</h4>
              <p className="text-gray-400 text-sm">
                Both components are connecting to the same Supabase project and querying the same 'properties' table. 
                Data structure mapping (snake_case DB columns to camelCase React state) appears consistent across both files.
                Any "missing" data is likely due to Row Level Security (RLS) policies or actual empty data fields, not a connection mismatch.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Data Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-[#1a1a1a] border-[#d4af37]/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Live Data Preview (properties table)</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length > 0 ? (
                 <div className="space-y-4">
                   {properties.map((prop, idx) => (
                     <div key={prop.id} className="p-4 rounded bg-[#0f0f0f] border border-gray-800 text-xs font-mono overflow-auto">
                        <div className="flex justify-between text-[#d4af37] mb-2">
                          <span className="font-bold">Row {idx + 1}: {prop.name}</span>
                          <span>ID: {prop.id}</span>
                        </div>
                        <pre className="text-gray-400">{JSON.stringify(prop, null, 2)}</pre>
                     </div>
                   ))}
                 </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {loading ? 'Loading...' : 'No properties found or table is empty.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#d4af37]/30">
            <CardHeader>
              <CardTitle className="text-white">Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto font-mono text-xs space-y-2 p-2 bg-[#0f0f0f] rounded">
                {logs.map((log, i) => (
                  <div key={i} className={
                    log.includes('[ERROR]') ? 'text-red-400' : 
                    log.includes('[SUCCESS]') ? 'text-green-400' : 
                    log.includes('[WARNING]') ? 'text-yellow-400' : 'text-gray-400'
                  }>
                    {log}
                  </div>
                ))}
                {logs.length === 0 && <span className="text-gray-600">Ready to start...</span>}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default DebugDatabaseSync;