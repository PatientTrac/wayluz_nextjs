'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getAllProperties } from '@/data/propertyManager'; // Inspecting this source
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Database, Server, AlertTriangle, CheckCircle, XCircle, Search, FileCode } from 'lucide-react';

const DebugDatabaseFull = () => {
  const [loading, setLoading] = useState(false);
  const [dbProperties, setDbProperties] = useState([]);
  const [localProperties, setLocalProperties] = useState([]);
  const [error, setError] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState({ url: '', keyMasked: '' });
  const [comparison, setComparison] = useState({ match: false, reason: '' });

  useEffect(() => {
    runFullDiagnostics();
  }, []);

  const runFullDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setComparison({ match: false, reason: 'Analyzing...' });

    try {
      // 1. Get Connection Info
      setConnectionInfo({
        url: supabase.supabaseUrl,
        keyMasked: supabase.supabaseKey 
          ? `${supabase.supabaseKey.substring(0, 10)}...${supabase.supabaseKey.substring(supabase.supabaseKey.length - 10)}` 
          : 'MISSING'
      });

      // 2. Fetch Raw DB Data
      const { data: dbData, error: dbError } = await supabase
        .from('properties')
        .select('*');

      if (dbError) throw dbError;
      setDbProperties(dbData || []);

      // 3. Fetch Local Manager Data (Main Site Data)
      // Note: Based on codebase analysis, propertyManager uses localStorage
      const localData = getAllProperties();
      setLocalProperties(localData || []);

      // 4. Compare
      compareDatasets(dbData || [], localData || []);

    } catch (err) {
      console.error('Diagnostic failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const compareDatasets = (dbData, localData) => {
    const dbCount = dbData.length;
    const localCount = localData.length;

    if (dbCount === 0 && localCount === 0) {
      setComparison({ match: true, reason: 'Both sources are empty.' });
      return;
    }

    // Check if IDs match
    const dbIds = new Set(dbData.map(p => p.id));
    const localIds = new Set(localData.map(p => String(p.id))); // LocalStorage IDs might be strings or numbers
    
    const onlyInDb = dbData.filter(p => !localIds.has(p.id));
    const onlyInLocal = localData.filter(p => !dbIds.has(String(p.id)));

    if (onlyInDb.length > 0 || onlyInLocal.length > 0) {
       setComparison({ 
         match: false, 
         reason: `Mismatch detected. ${onlyInDb.length} items only in DB. ${onlyInLocal.length} items only in Local/Main Site.` 
       });
    } else {
       setComparison({ match: true, reason: 'IDs match across both sources (Content may vary).' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 p-6 pt-24 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#d4af37] flex items-center gap-3">
              <Database className="w-8 h-8" />
              Full Database Diagnostics
            </h1>
            <p className="text-gray-400 mt-2">
              Verification of Supabase connection, raw data retrieval, and logic audit.
            </p>
          </div>
          <Button 
            onClick={runFullDiagnostics} 
            disabled={loading}
            className="bg-[#d4af37] text-black hover:bg-[#c9a961]"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh Query
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Configuration Section */}
        <Card className="bg-[#1a1a1a] border-[#d4af37]/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-[#d4af37]" />
              Configuration Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Project URL</label>
              <code className="block p-3 bg-black/50 rounded border border-gray-800 text-blue-400 break-all">
                {connectionInfo.url}
              </code>
              <div className="flex items-center gap-2 text-xs">
                {Boolean(connectionInfo.url) ? (
                   <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Supabase URL loaded</span>
                ) : (
                   <span className="text-yellow-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Supabase URL missing or unavailable</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Anon Key (Masked)</label>
              <code className="block p-3 bg-black/50 rounded border border-gray-800 text-yellow-600 break-all">
                {connectionInfo.keyMasked}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Data Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main DB Results */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1a1a1a] border-[#d4af37]/30 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Supabase Database Results</CardTitle>
                  <CardDescription>
                    Query: <code className="bg-black/50 px-1 rounded text-green-400">supabase.from('properties').select('*')</code>
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[#d4af37] border-[#d4af37]">
                  Count: {dbProperties.length}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-800 overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="bg-[#0f0f0f]">
                        <TableRow className="border-gray-800 hover:bg-transparent">
                          <TableHead className="text-gray-400">ID</TableHead>
                          <TableHead className="text-gray-400">Name</TableHead>
                          <TableHead className="text-gray-400">Price (USD)</TableHead>
                          <TableHead className="text-gray-400">Type</TableHead>
                          <TableHead className="text-gray-400">Raw</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbProperties.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No records found in remote database.
                            </TableCell>
                          </TableRow>
                        ) : (
                          dbProperties.map((prop) => (
                            <TableRow key={prop.id} className="border-gray-800 hover:bg-[#252525]">
                              <TableCell className="font-mono text-xs text-gray-500">{prop.id.substring(0,8)}...</TableCell>
                              <TableCell className="text-gray-300 font-medium">{prop.name}</TableCell>
                              <TableCell className="text-green-400">${prop.price_usd?.toLocaleString()}</TableCell>
                              <TableCell className="text-gray-400">{prop.type}</TableCell>
                              <TableCell>
                                <details className="cursor-pointer">
                                  <summary className="text-xs text-[#d4af37] hover:underline">JSON</summary>
                                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={(e) => e.target.tagName === 'DIV' && e.target.removeAttribute('open')}>
                                    <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-800 shadow-2xl relative">
                                        <h3 className="text-lg font-bold text-white mb-4">Raw Property Data</h3>
                                        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                                          {JSON.stringify(prop, null, 2)}
                                        </pre>
                                        <Button 
                                          variant="ghost" 
                                          className="absolute top-2 right-2 text-gray-500 hover:text-white"
                                          onClick={(e) => e.target.closest('details').removeAttribute('open')}
                                        >
                                          Close
                                        </Button>
                                    </div>
                                  </div>
                                </details>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audit & Local Status */}
          <div className="space-y-6">
            
            {/* Status Card */}
            <Card className="bg-[#1a1a1a] border-[#d4af37]/30">
               <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  Sync Status
                </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className={`p-4 rounded border ${comparison.match ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                   <div className="flex items-center gap-2 mb-2">
                      {comparison.match ? <CheckCircle className="text-green-500 w-5 h-5"/> : <XCircle className="text-red-500 w-5 h-5"/>}
                      <span className={`font-bold ${comparison.match ? 'text-green-500' : 'text-red-500'}`}>
                        {comparison.match ? 'Synced' : 'Data Mismatch'}
                      </span>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed">
                     {comparison.reason}
                   </p>
                 </div>

                 <div className="space-y-2 text-sm text-gray-400">
                   <div className="flex justify-between p-2 bg-black/30 rounded">
                     <span>Supabase (Remote)</span>
                     <span className="font-mono text-white">{dbProperties.length} records</span>
                   </div>
                   <div className="flex justify-between p-2 bg-black/30 rounded">
                     <span>Main Site (Local)</span>
                     <span className="font-mono text-white">{localProperties.length} records</span>
                   </div>
                 </div>
               </CardContent>
            </Card>

            {/* Code Logic Audit */}
            <Card className="bg-[#1a1a1a] border-[#d4af37]/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-purple-400" />
                  Code Logic Audit
                </CardTitle>
                <CardDescription>Analysis of <code>propertyManager.js</code></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-yellow-900/10 border-yellow-900/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-500">Critical Finding</AlertTitle>
                  <AlertDescription className="text-yellow-400/80 text-xs mt-1">
                    The <code>getAllProperties()</code> function currently reads from <strong>LocalStorage</strong>, NOT Supabase.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 text-xs text-gray-400">
                  <p>
                    <strong>1. Source:</strong> The function executes <code>JSON.parse(localStorage.getItem('wayluz_properties'))</code>.
                  </p>
                  <p>
                    <strong>2. Filters:</strong> There are NO database-level filters (WHERE clauses) because it's not querying the DB.
                  </p>
                  <p>
                    <strong>3. Limiting Factors:</strong> Since the main site reads from LocalStorage, any data you add directly to Supabase via SQL or Admin Panel (if connected to DB) will NOT appear on the public site until <code>propertyManager.js</code> is updated to fetch from Supabase.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugDatabaseFull;