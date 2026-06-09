'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, RefreshCw, AlertTriangle, Database, Youtube, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const DebugVideoData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [targetId, setTargetId] = useState('1705421234');
  const [verificationLog, setVerificationLog] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setVerificationLog(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      addLog(`Fetching property ${targetId}...`, 'info');
      
      const { data: property, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('id', targetId)
        .single();

      if (err) throw err;

      setData(property);
      addLog('Property fetched successfully', 'success');
      
      // Verify video structure
      if (property.videos) {
          addLog(`Current videos type: ${Array.isArray(property.videos) ? 'Array' : typeof property.videos}`, 'info');
          addLog(`Current videos content: ${JSON.stringify(property.videos)}`, 'info');
      } else {
          addLog('Videos field is null or undefined', 'warning');
      }

    } catch (err) {
      console.error('Debug fetch error:', err);
      setError(err.message);
      addLog(`Fetch error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScript = async () => {
    setUpdating(true);
    setVerificationLog([]); // Clear logs for new run
    addLog('🚀 Starting Update Task', 'info');
    
    try {
      const exactPayload = ["https://www.youtube-nocookie.com/embed/C3q7tDTmRAA"];
      addLog(`Payload prepared: ${JSON.stringify(exactPayload)}`, 'info');
      
      let actualId = targetId;

      // 1. Attempt Update
      addLog(`Executing: supabase.from('properties').update(...).eq('id', '${actualId}')`, 'info');
      
      let { error: updateError } = await supabase
        .from('properties')
        .update({ videos: exactPayload })
        .eq('id', actualId);

      // 2. Fallback Mechanism: ID Mismatch Handling
      if (updateError && updateError.code === '22P02') {
         addLog(`⚠️ ID "${actualId}" is not a valid UUID. Attempting to resolve by property name...`, 'warning');
         
         const { data: foundProperty } = await supabase
            .from('properties')
            .select('id')
            .eq('name', 'The Secure Executive Home in Palestina')
            .single();

         if (foundProperty) {
             actualId = foundProperty.id;
             addLog(`✅ Resolved correct UUID: ${actualId}`, 'success');
             setTargetId(actualId);
             
             // Retry update with valid UUID
             addLog(`Retrying update with valid UUID...`, 'info');
             const retryResult = await supabase
                .from('properties')
                .update({ videos: exactPayload })
                .eq('id', actualId);
             
             updateError = retryResult.error;
         } else {
             addLog(`❌ Could not find property by name to resolve UUID issue.`, 'error');
         }
      }

      if (updateError) throw updateError;

      addLog('✅ Update operation completed successfully', 'success');
      
      toast({
        title: "Update Successful",
        description: "Property videos updated. Verifying data...",
        className: "bg-green-600 text-white"
      });

      // 3. Immediate Verification
      addLog('Verifying update by re-fetching data...', 'info');
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('properties')
        .select('videos')
        .eq('id', actualId)
        .single();

      if (verifyError) throw verifyError;

      addLog(`Verification Result: ${JSON.stringify(verifyData.videos)}`, 'success');

      // Refresh full view
      fetchData();

    } catch (err) {
      console.error('❌ Script failed:', err);
      const msg = err.message || "Unknown error occurred";
      
      toast({
        title: "Script Failed",
        description: msg,
        variant: "destructive"
      });
      
      setError(msg);
      addLog(`Failed: ${msg}`, 'error');
      
    } finally {
      setUpdating(false);
      addLog('Task finished', 'info');
    }
  };

  useEffect(() => {
    // Attempt initial fetch, but don't crash if ID is invalid
    if (targetId) fetchData();
  }, []);

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 bg-gray-950 text-white font-mono">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2">
              <Database className="w-8 h-8" />
              Property Video Debugger
            </h1>
            <p className="text-gray-400 mt-2">Target Property ID:</p>
            <div className="flex gap-2 mt-1">
                <Input 
                    value={targetId} 
                    onChange={(e) => setTargetId(e.target.value)}
                    className="bg-gray-900 border-gray-700 font-mono text-white w-64 md:w-96"
                />
                <Button onClick={fetchData} variant="outline" size="icon" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdateScript} 
              disabled={loading || updating} 
              className="bg-green-600 hover:bg-green-700 text-white border border-green-500"
            >
              {updating ? <Loader2 className="animate-spin mr-2" /> : <Youtube className="mr-2" />}
              Update Videos Array
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                 {/* Logs Console */}
                 <Card className="bg-gray-900 border-gray-800 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
                            <CheckCircle2 className="w-4 h-4" /> Verification Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="font-mono text-xs max-h-[300px] overflow-y-auto space-y-2 pt-2">
                        {verificationLog.length === 0 && <span className="text-gray-600 italic">No logs yet... Click "Update Videos Array" to start.</span>}
                        {verificationLog.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${
                                log.type === 'error' ? 'text-red-400' : 
                                log.type === 'success' ? 'text-green-400' : 
                                log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
                            }`}>
                                <span className="text-gray-600 min-w-[80px]">[{log.timestamp}]</span>
                                <span className="break-all">{log.message}</span>
                            </div>
                        ))}
                    </CardContent>
                 </Card>

                 {error && (
                  <div className="bg-red-950/50 border border-red-500 text-red-200 p-6 rounded-lg shadow-lg shadow-red-900/10">
                    <h3 className="flex items-center gap-2 font-bold text-xl mb-2">
                      <AlertTriangle className="text-red-500" /> Error
                    </h3>
                    <p className="font-mono text-sm whitespace-pre-wrap">{error}</p>
                    {error.includes("22P02") && (
                      <div className="mt-4 p-3 bg-red-900/30 rounded text-sm border border-red-800">
                        <strong>Tip:</strong> The ID "{targetId}" is likely numeric, but the database expects a UUID. 
                        The update script automatically tried to find the property by name, but if that failed, please verify the correct ID.
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Raw JSON View */}
            <Card className="bg-gray-900 border-gray-800 text-white h-full flex flex-col">
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wider text-gray-400">Current Database Record</CardTitle>
                  <CardDescription className="text-gray-500">
                    Video Field Type: <span className="text-blue-400">{data?.videos ? (Array.isArray(data.videos) ? 'Array' : typeof data.videos) : 'Null'}</span>
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[400px]">
                  <div className="bg-black p-4 rounded overflow-auto text-xs text-green-400 font-mono border border-gray-800 shadow-inner h-full max-h-[600px]">
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                  </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default DebugVideoData;