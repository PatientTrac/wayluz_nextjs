'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Database, Server, HardDrive } from 'lucide-react';

const DiagnosticPage = () => {
  const [loading, setLoading] = useState(true);
  const [configInfo, setConfigInfo] = useState(null);
  const [dbStatus, setDbStatus] = useState({ success: false, data: null, error: null });
  const [storageStatus, setStorageStatus] = useState({ success: false, buckets: [], error: null });
  const [envInfo, setEnvInfo] = useState({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    
    // 1. Analyze Configuration
    // We access the internal URL and key from the client instance if available, 
    // or infer from what we know we just set.
    const url = supabase.supabaseUrl;
    const key = supabase.supabaseKey;
    
    const projectId = url ? url.split('https://')[1].split('.')[0] : 'Unknown';
    
    setConfigInfo({
      url,
      maskedKey: key ? `${key.substring(0, 10)}...${key.substring(key.length - 10)}` : 'Not Found',
      projectId
    });

    // 2. Check Database (Properties Table)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(3);
        
      if (error) throw error;
      
      setDbStatus({
        success: true,
        data: data,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        count: data.length
      });
    } catch (error) {
      setDbStatus({
        success: false,
        error: error.message
      });
    }

    // 3. Check Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      setStorageStatus({
        success: true,
        buckets: data || []
      });
    } catch (error) {
      // Sometimes listBuckets is restricted by RLS, we can try to access the known bucket
      setStorageStatus({
        success: false,
        error: error.message
      });
    }

    setLoading(false);
  };

  const StatusIcon = ({ success }) => (
    success ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <XCircle className="text-red-500 w-5 h-5" />
  );

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 px-4">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">System Diagnostic Report</h1>
          <Badge variant={loading ? "outline" : "default"} className={loading ? "animate-pulse" : "bg-green-600"}>
            {loading ? "Running Tests..." : "Diagnostics Complete"}
          </Badge>
        </div>

        {/* Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Client Configuration
            </CardTitle>
            <CardDescription>
              Current Supabase client settings and environment variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Project URL</p>
                <code className="text-sm break-all">{configInfo?.url}</code>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium text-gray-500">Project ID</p>
                <code className="text-sm font-bold text-blue-600">{configInfo?.projectId}</code>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Anon Key (Masked)</p>
                <code className="text-sm break-all">{configInfo?.maskedKey}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Connection (Table: 'properties')
            </CardTitle>
            <CardDescription>
              Testing connection to 'properties' table and schema inspection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus.error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>{dbStatus.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Successfully connected to database
                </div>
                
                {dbStatus.data && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {dbStatus.columns.slice(0, 5).map(col => (
                            <TableHead key={col}>{col}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbStatus.data.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.id?.substring(0, 8)}...</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.location}</TableCell>
                            <TableCell>{row.price_usd}</TableCell>
                            <TableCell>{row.type}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Showing {dbStatus.count} record(s). Columns found: {dbStatus.columns?.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage Configuration
            </CardTitle>
            <CardDescription>
              Bucket availability and access checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {storageStatus.error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Storage Access Warning</AlertTitle>
                <AlertDescription>
                  Could not list buckets: {storageStatus.error}. 
                  (This might be normal if RLS policies prevent listing buckets publicly).
                  <br/>
                  Target Bucket: <strong>property-images</strong>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Storage service accessible
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {storageStatus.buckets.map(bucket => (
                     <div key={bucket.id} className="p-3 bg-gray-100 rounded border flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{bucket.name}</span>
                        {bucket.public && <Badge variant="secondary" className="text-xs">Public</Badge>}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center p-4">
          <p className="text-gray-500 text-sm">
            Generated by Hostinger Horizons Diagnostic Tool
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;