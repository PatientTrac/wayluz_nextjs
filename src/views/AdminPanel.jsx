'use client';

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, Film, EyeOff, ShieldCheck, Loader2, LogOut, AlertCircle, CheckCircle2, Bug, PlayCircle, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/context/LanguageContext';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useNavigate } from '@/lib/routerAdapter';
import PriceDisplay from '@/components/PriceDisplay';
import ImageUploadComponent from '@/components/ImageUploadComponent';
import ImageGalleryManager from '@/components/ImageGalleryManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SecurityModal from '@/components/SecurityModal';

const AdminPanel = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isEditMode, toggleEditMode, isAuthenticated, isLoading, logout, needsEnrollment } = useAdminAuth();
  const navigate = useNavigate();
  const [showSecurity, setShowSecurity] = useState(false);

  // If the admin has no authenticator set up yet, nudge them to the Security panel.
  useEffect(() => {
    if (needsEnrollment) setShowSecurity(true);
  }, [needsEnrollment]);
  
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [diagnosticLog, setDiagnosticLog] = useState([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // UUID for new properties (generated on form reset)
  const [tempId, setTempId] = useState(null);

  const initialFormState = {
    name: '',
    location: '',
    priceCOP: '',
    priceUSD: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    type: 'House',
    yearBuilt: new Date().getFullYear(),
    description: '',
    amenitiesString: '',
    images: [],
    videos: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [newVideo, setNewVideo] = useState({ url: '', title: '' });

  // 1. Auth Check Redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin-login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // 2. Initial Data Load & Connection Test
  useEffect(() => {
    if (isAuthenticated) {
      loadProperties();
      runConnectionDiagnostics();
    }
  }, [isAuthenticated]);

  // Generate a robust UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Helper logger
  const logDiagnostic = (message, type = 'info', data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type, data };
    console.log(`[AdminDiagnostic] ${timestamp} - ${message}`, data || '');
    setDiagnosticLog(prev => [logEntry, ...prev]);
  };

  const runConnectionDiagnostics = async () => {
    logDiagnostic('Starting Supabase connection diagnostics...', 'info');
    try {
      // 1. Check Auth User
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logDiagnostic('Auth Check Failed', 'error', authError);
      } else {
        logDiagnostic('Auth Check Passed', 'success', { id: user?.id, role: user?.role });
      }

      // 2. Check Read Access
      const { data: readData, error: readError } = await supabase.from('properties').select('count', { count: 'exact', head: true });
      if (readError) {
        logDiagnostic('Read Access Failed', 'error', readError);
      } else {
        logDiagnostic('Read Access Passed', 'success', { count: readData });
      }

    } catch (e) {
      logDiagnostic('Diagnostic Exception', 'error', e);
    }
  };

  const loadProperties = async () => {
    setLoading(true);
    logDiagnostic('Loading properties...');
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logDiagnostic('Failed to load properties', 'error', error);
        throw error;
      }
      
      logDiagnostic(`Loaded ${data.length} properties`, 'success');
      
      const mappedProps = data.map(p => ({
        ...p,
        priceCOP: p.price_cop,
        priceUSD: p.price_usd,
        yearBuilt: p.year_built,
        amenities: p.amenities || [],
        videos: p.videos || [],
        images: p.images || []
      }));
      
      setProperties(mappedProps);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({ 
        title: "Load Error", 
        description: "Failed to load properties. Check diagnostics.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const convertUSDtoCOP = (usd) => Math.round(usd * 4000); 
  const convertCOPtoUSD = (cop) => Math.round(cop / 4000);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Auto-calculate currencies
    if (name === 'priceUSD' && value) {
       newFormData.priceCOP = convertUSDtoCOP(Number(value));
    } else if (name === 'priceCOP' && value) {
       newFormData.priceUSD = convertCOPtoUSD(Number(value));
    }

    setFormData(newFormData);
  };

  // Image handling
  const handleImagesUploaded = (newImages) => {
    setFormData(prev => {
      // If it's the first image ever added, make it featured
      const isFirstImage = prev.images.length === 0;
      const processedNewImages = newImages.map((img, idx) => ({
        ...img,
        featured: isFirstImage && idx === 0
      }));
      
      const updatedImages = [...prev.images, ...processedNewImages];
      return { ...prev, images: updatedImages };
    });
    toast({
      title: "Images Added",
      description: "Don't forget to save your changes to persist these images.",
    });
  };

  const handleUpdateImages = (updatedImages) => {
    setFormData(prev => ({
      ...prev,
      images: updatedImages
    }));
  };

  // Video handling
  const handleAddVideo = () => {
    if (!newVideo.url) return;
    
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, { ...newVideo }]
    }));
    setNewVideo({ url: '', title: '' });
  };

  const handleDeleteVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  // Task 4: Comprehensive Validation
  const validateForm = () => {
    logDiagnostic('Starting form validation...');
    const errors = [];
    
    // Required fields check
    if (!formData.name?.trim()) errors.push("Property Name is required");
    if (!formData.location?.trim()) errors.push("Location is required");
    
    // Numeric validation
    if (!formData.priceCOP || isNaN(Number(formData.priceCOP)) || Number(formData.priceCOP) <= 0) errors.push("Price (COP) must be a valid positive number");
    if (!formData.priceUSD || isNaN(Number(formData.priceUSD)) || Number(formData.priceUSD) <= 0) errors.push("Price (USD) must be a valid positive number");
    if (!formData.area || isNaN(Number(formData.area)) || Number(formData.area) <= 0) errors.push("Area must be a valid positive number");
    if (formData.bedrooms === '' || isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0) errors.push("Bedrooms must be a valid number (0 or more)");
    if (formData.bathrooms === '' || isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0) errors.push("Bathrooms must be a valid number (0 or more)");
    
    // Data structure validation
    if (!Array.isArray(formData.images)) errors.push("Images data structure is invalid");
    if (!Array.isArray(formData.videos)) errors.push("Videos data structure is invalid");

    if (errors.length > 0) {
      logDiagnostic('Validation failed', 'error', errors);
      toast({
        title: "Validation Error",
        description: (
          <ul className="list-disc pl-4 max-h-32 overflow-y-auto">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        ),
        variant: "destructive"
      });
      return false;
    }
    logDiagnostic('Validation passed', 'success');
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    logDiagnostic('Preparing data for submission...');
    
    // Determine featured image URL
    const featuredImg = formData.images.find(img => img.featured);
    const featuredImageUrl = featuredImg ? featuredImg.url : (formData.images[0]?.url || null);

    // Task 5: Verify schema matching
    const propertyData = {
      name: formData.name,
      location: formData.location,
      description: formData.description,
      price_cop: Number(formData.priceCOP),
      price_usd: Number(formData.priceUSD),
      area: Number(formData.area),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      year_built: Number(formData.yearBuilt),
      type: formData.type,
      amenities: formData.amenitiesString.split(',').map(item => item.trim()).filter(Boolean),
      images: formData.images,
      videos: formData.videos,
      featured_image_url: featuredImageUrl
    };

    logDiagnostic('Data Payload Prepared', 'info', propertyData);

    try {
      if (editingId) {
        // UPDATE Existing Property
        logDiagnostic(`Attempting UPDATE on ID: ${editingId}`, 'info');
        const { data, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingId)
          .select(); // Task 3: Wait for response data
        
        if (error) {
          logDiagnostic('Update Failed', 'error', error);
          throw error;
        }
        
        logDiagnostic('Update Successful', 'success', data);
        toast({ title: "Success", description: "Property updated successfully", className: "bg-green-600 text-white" });
      } else {
        // CREATE New Property
        const insertData = { ...propertyData };
        insertData.id = tempId || generateUUID();
        
        logDiagnostic(`Attempting INSERT with ID: ${insertData.id}`, 'info');

        const { data, error } = await supabase
          .from('properties')
          .insert([insertData])
          .select();

        if (error) {
          logDiagnostic('Insert Failed', 'error', error);
          throw error;
        }

        logDiagnostic('Insert Successful', 'success', data);
        toast({ title: "Success", description: "Property created successfully", className: "bg-green-600 text-white" });
      }

      await loadProperties();
      resetForm();
      setActiveTab('list');
    } catch (error) {
      console.error('Save error details:', error);
      // Task 6: Error handling
      let errorMessage = error.message || 'Unknown error';
      if (error.code === '42501') errorMessage = 'Permission denied (RLS Policy Violation). Check database policies.';
      if (error.code === '23505') errorMessage = 'Duplicate key violation.';
      
      logDiagnostic('Operation Aborted due to Exception', 'error', { code: error.code, message: errorMessage, details: error.details });
      
      toast({ 
        title: "Database Operation Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (property) => {
    setEditingId(property.id);
    setTempId(property.id); 
    setFormData({
      ...property,
      amenitiesString: property.amenities ? property.amenities.join(', ') : '',
      priceCOP: property.price_cop || property.priceCOP || '',
      priceUSD: property.price_usd || property.priceUSD || '',
      yearBuilt: property.year_built || property.yearBuilt || '',
      images: Array.isArray(property.images) ? property.images : [],
      videos: Array.isArray(property.videos) ? property.videos : [],
      area: property.area || '',
      bedrooms: property.bedrooms ?? '',
      bathrooms: property.bathrooms ?? '',
    });
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      setLoading(true);
      logDiagnostic(`Attempting DELETE on ID: ${id}`, 'info');
      try {
        const { error, data } = await supabase
          .from('properties')
          .delete()
          .eq('id', id)
          .select();

        if (error) {
          logDiagnostic('Delete Failed', 'error', error);
          throw error;
        }
        
        logDiagnostic('Delete Successful', 'success', data);
        toast({ title: "Deleted", description: "Property removed from database." });
        await loadProperties();
      } catch (error) {
        console.error('Delete error:', error);
        toast({ title: "Error", description: `Failed to delete property: ${error.message}`, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
  };

  const runTestFlow = async () => {
    if (!window.confirm("This will create a TEST property, attempt to read it back, and then delete it. Continue?")) return;
    
    setShowDiagnostics(true);
    logDiagnostic("=== STARTING END-TO-END TEST FLOW ===", 'info');
    
    const testId = generateUUID();
    const testProperty = {
      id: testId,
      name: `TEST PROPERTY ${new Date().toLocaleTimeString()}`,
      location: 'Test Location',
      description: 'This is an automated test property',
      price_cop: 1000000,
      price_usd: 250,
      bedrooms: 1,
      bathrooms: 1,
      area: 50,
      year_built: 2024,
      type: 'House',
      images: [],
      videos: [],
      amenities: ['Test Amenity'],
      featured_image_url: null
    };

    try {
      // 1. Create
      logDiagnostic(`STEP 1: Inserting Test Property ${testId}...`);
      const { error: insertError } = await supabase.from('properties').insert([testProperty]);
      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
      logDiagnostic("STEP 1: Insert Complete", 'success');

      // 2. Read
      logDiagnostic("STEP 2: Verifying Data via Fetch...");
      const { data: readData, error: readError } = await supabase.from('properties').select('*').eq('id', testId).single();
      if (readError) throw new Error(`Read failed: ${readError.message}`);
      if (!readData) throw new Error("Read returned no data");
      logDiagnostic("STEP 2: Verification Complete", 'success', readData);

      // 3. Delete
      logDiagnostic("STEP 3: Cleaning up (Deleting)...");
      const { error: deleteError } = await supabase.from('properties').delete().eq('id', testId);
      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
      logDiagnostic("STEP 3: Cleanup Complete", 'success');

      logDiagnostic("=== TEST FLOW COMPLETED SUCCESSFULLY ===", 'success');
      alert("Test Flow Completed Successfully! Check diagnostics log.");

    } catch (e) {
      logDiagnostic("=== TEST FLOW FAILED ===", 'error', e);
      alert(`Test Flow Failed: ${e.message}`);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setTempId(generateUUID());
    setNewVideo({ url: '', title: '' });
  };

  const startNewProperty = () => {
    resetForm();
    setActiveTab('form');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#d4af37] w-12 h-12" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Helmet>
        <title>{t.admin.title} - WayLuz Inversiones S.A.S.</title>
      </Helmet>

      <div className="min-h-screen pt-24 bg-[#0f0f0f] pb-12 font-sans text-gray-100">
        <div className="container mx-auto px-4">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">
                {t.admin.title} <span className="text-[#d4af37]">{t.admin.titleAccent}</span>
              </h1>
              <p className="text-gray-400 mt-2">Manage your property portfolio</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/inbox')}
                variant="outline"
                className="border-green-500/50 text-green-500 hover:bg-green-500/10 gap-2"
              >
                <MessageSquare size={18} /> Inbox
              </Button>
              <Button
                onClick={() => navigate('/inbox/settings')}
                variant="outline"
                className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 gap-2"
              >
                <Settings size={18} /> Inbox Settings
              </Button>
              <Button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                variant="outline"
                className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10 gap-2"
              >
                <Bug size={18} /> {showDiagnostics ? 'Hide Logs' : 'Diagnostics'}
              </Button>
              <Button
                onClick={() => setShowSecurity(true)}
                variant="outline"
                className="border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 gap-2"
              >
                <ShieldCheck size={18} /> Security
              </Button>
              <Button
                onClick={() => {
                  logout();
                  navigate('/admin-login');
                }}
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-2"
              >
                <LogOut size={18} /> Logout
              </Button>
            </div>
          </div>

          {showDiagnostics && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 bg-black border border-blue-900/50 rounded-xl overflow-hidden"
            >
              <div className="bg-blue-900/20 p-3 flex justify-between items-center border-b border-blue-900/30">
                <h3 className="font-mono text-sm text-blue-400 font-bold flex items-center gap-2">
                  <Bug size={14}/> SYSTEM DIAGNOSTICS & LOGS
                </h3>
                <div className="flex gap-2">
                  <Button size="xs" variant="ghost" className="h-6 text-xs text-blue-300 hover:text-white" onClick={() => setDiagnosticLog([])}>Clear</Button>
                  <Button size="xs" variant="outline" className="h-6 text-xs border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={runTestFlow}>
                    <PlayCircle size={12} className="mr-1"/> Run CRUD Test
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-[300px] overflow-y-auto font-mono text-xs space-y-2">
                {diagnosticLog.length === 0 && <span className="text-gray-600 italic">No logs generated yet...</span>}
                {diagnosticLog.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-800 pb-2 last:border-0">
                    <div className="flex gap-2 text-gray-500 mb-1">
                      <span>[{log.timestamp.split('T')[1].replace('Z','')}]</span>
                      <span className={`uppercase font-bold ${
                        log.type === 'error' ? 'text-red-500' : 
                        log.type === 'success' ? 'text-green-500' : 'text-blue-400'
                      }`}>{log.type}</span>
                    </div>
                    <div className="text-gray-300">{log.message}</div>
                    {log.data && (
                      <pre className="mt-1 bg-gray-900 p-2 rounded text-gray-400 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Edit Mode Status Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
              isEditMode ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : 'bg-gray-800/30 border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEditMode ? 'bg-[#d4af37] text-black' : 'bg-gray-700 text-gray-400'}`}>
                {isEditMode ? <ShieldCheck size={24} /> : <EyeOff size={24} />}
              </div>
              <div>
                <h2 className={`font-bold text-lg ${isEditMode ? 'text-[#d4af37]' : 'text-gray-300'}`}>
                  {isEditMode ? 'Public Edit Mode Active' : 'Public Edit Mode Inactive'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isEditMode 
                    ? 'You can see edit controls on the public website pages.' 
                    : 'Edit controls are hidden on the public website.'}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={toggleEditMode}
              variant={isEditMode ? "outline" : "default"}
              className={`${
                isEditMode 
                  ? 'border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black' 
                  : 'bg-[#d4af37] text-black hover:bg-[#c9a961]'
              } gap-2 w-full md:w-auto font-semibold`}
            >
              {isEditMode ? <EyeOff size={18} /> : <Edit2 size={18} />}
              {isEditMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
            </Button>
          </motion.div>

          <div className="flex justify-start space-x-4 mb-8 border-b border-[#d4af37]/20 pb-4">
            <Button
              onClick={() => setActiveTab('list')}
              className={`${activeTab === 'list' ? 'bg-[#d4af37] text-black font-bold' : 'bg-[#1a1a1a] text-white border border-[#d4af37]/30 hover:bg-[#d4af37]/20'}`}
            >
              {t.admin.tabs.list}
            </Button>
            <Button
              onClick={startNewProperty}
              className={`${activeTab === 'form' ? 'bg-[#d4af37] text-black font-bold' : 'bg-[#1a1a1a] text-white border border-[#d4af37]/30 hover:bg-[#d4af37]/20'}`}
            >
              {editingId ? t.admin.tabs.edit : t.admin.tabs.add}
            </Button>
          </div>

          {activeTab === 'list' ? (
            <div className="grid gap-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-[#d4af37] w-12 h-12" />
                </div>
              ) : (
                <>
                {properties.map(property => {
                   const featuredImg = property.images?.find(img => img.featured) || property.images?.[0];
                   return (
                    <div key={property.id} className="bg-[#1a1a1a] p-6 rounded-xl border border-[#d4af37]/20 flex flex-col lg:flex-row justify-between items-center gap-6 hover:border-[#d4af37]/60 transition-all shadow-lg">
                      <div className="flex items-center gap-6 w-full lg:w-auto">
                        {featuredImg ? (
                          <div className="w-32 h-32 shrink-0 rounded-lg overflow-hidden border border-[#d4af37]/20">
                            <img 
                              src={featuredImg.url} 
                              alt={property.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                           <div className="w-32 h-32 shrink-0 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center text-gray-500">
                             <EyeOff size={24} />
                           </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{property.name}</h3>
                          <div className="flex items-center text-gray-400 text-sm mb-3">
                            <span className="bg-[#d4af37]/10 text-[#d4af37] px-2 py-0.5 rounded text-xs uppercase font-bold mr-2">{property.type}</span>
                            {property.location}
                          </div>
                          <PriceDisplay priceCOP={property.priceCOP} priceUSD={property.priceUSD} size="small" />
                          <div className="mt-2 text-xs text-gray-500 flex gap-4">
                             <span>{property.bedrooms} Beds</span>
                             <span>{property.bathrooms} Baths</span>
                             <span>{property.area} m²</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3 w-full lg:w-auto justify-end">
                        <Button 
                          onClick={() => handleEdit(property)} 
                          variant="outline" 
                          className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black gap-2 h-12 px-6"
                        >
                          <Edit2 size={18} /> Edit
                        </Button>
                        <Button 
                          onClick={() => handleDelete(property.id)} 
                          variant="destructive" 
                          className="bg-red-900/40 hover:bg-red-600 border border-red-900 gap-2 h-12 px-6"
                        >
                          <Trash2 size={18} /> Delete
                        </Button>
                      </div>
                    </div>
                   )
                })}
                {properties.length === 0 && (
                  <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-[#d4af37]/10">
                    <p className="text-gray-400 text-lg mb-4">No properties found in the database.</p>
                    <Button onClick={startNewProperty} className="bg-[#d4af37] text-black hover:bg-[#c9a961]">
                      Create your first property
                    </Button>
                  </div>
                )}
                </>
              )}
            </div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit} 
              className="max-w-6xl mx-auto bg-[#1a1a1a] p-8 rounded-xl border border-[#d4af37]/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? `Editing: ${formData.name}` : 'Create New Property'}
                </h2>
                <div className="text-sm text-gray-500 font-mono">
                  ID: {editingId || tempId}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="text-[#d4af37] font-semibold border-b border-gray-800 pb-2">Basic Details</h3>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.name} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none transition-all focus:ring-1 focus:ring-[#d4af37]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.location} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none transition-all"
                      required
                    />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.type}</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                      >
                        <option value="House">House</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Finca">Finca</option>
                        <option value="Land">Land</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.year}</label>
                      <input
                        type="number"
                        name="yearBuilt"
                        value={formData.yearBuilt}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Financials & Specs */}
                <div className="space-y-6">
                  <h3 className="text-[#d4af37] font-semibold border-b border-gray-800 pb-2">Financials & Specs</h3>
                   <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#d4af37] mb-2 font-medium">{t.admin.form.priceUSD} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          name="priceUSD"
                          value={formData.priceUSD}
                          onChange={handleInputChange}
                          className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 pl-8 rounded-lg text-white focus:border-[#d4af37] outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#d4af37] mb-2 font-medium">{t.admin.form.priceCOP} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          name="priceCOP"
                          value={formData.priceCOP}
                          onChange={handleInputChange}
                          className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 pl-8 rounded-lg text-white focus:border-[#d4af37] outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.area} (m²)</label>
                      <input
                        type="number"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.bedrooms}</label>
                      <input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.bathrooms}</label>
                      <input
                        type="number"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.desc}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-gray-300 mb-2 font-medium">{t.admin.form.amenities}</label>
                <input
                  type="text"
                  name="amenitiesString"
                  value={formData.amenitiesString}
                  onChange={handleInputChange}
                  placeholder="Comma separated list (e.g. Pool, WiFi, Gym, 24/7 Security)"
                  className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 p-3 rounded-lg text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Enhanced Image Management */}
              <div className="mb-8 p-6 bg-[#0f0f0f] rounded-xl border border-[#d4af37]/20">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-[#d4af37] font-semibold text-lg">Property Images</h3>
                   {formData.images.length > 0 && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> {formData.images.length} images staged</span>}
                </div>
                
                <Alert className="mb-4 bg-blue-900/20 border-blue-900 text-blue-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Images are uploaded immediately, but you must click "Save Property" at the bottom to link them to this property record.
                  </AlertDescription>
                </Alert>

                <ImageUploadComponent 
                  onImagesUploaded={handleImagesUploaded} 
                  propertyId={editingId || tempId} 
                />
                <ImageGalleryManager images={formData.images} onUpdateImages={handleUpdateImages} />
              </div>

              {/* Video Management */}
              <div className="mb-8 p-6 border border-[#d4af37]/20 rounded-xl bg-[#0f0f0f]">
                <h3 className="text-[#d4af37] font-semibold mb-4 flex items-center text-lg">
                  <Film className="mr-2" size={24} /> {t.admin.form.videos}
                </h3>
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Video URL (YouTube, Vimeo)"
                    value={newVideo.url}
                    onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    className="flex-[2] bg-[#1a1a1a] border border-[#d4af37]/30 p-3 rounded-lg text-white text-sm focus:border-[#d4af37] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title (Optional)"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    className="flex-1 bg-[#1a1a1a] border border-[#d4af37]/30 p-3 rounded-lg text-white text-sm focus:border-[#d4af37] outline-none"
                  />
                  <Button type="button" onClick={handleAddVideo} className="bg-[#d4af37] text-black hover:bg-[#c9a961]"><Plus size={18} /> Add Video</Button>
                </div>
                <div className="space-y-2">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="flex justify-between items-center bg-[#1a1a1a] p-3 rounded-lg text-sm border border-[#d4af37]/10">
                      <div className="flex items-center gap-2 overflow-hidden">
                         <Film size={14} className="text-gray-500 shrink-0"/>
                         <span className="text-gray-300 font-medium truncate">{video.title || "Untitled Video"}</span>
                         <span className="text-gray-600 text-xs truncate max-w-[200px]">{video.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(index)}
                        className="text-red-500 hover:text-red-400 p-2 hover:bg-red-900/20 rounded transition-colors"
                        title="Remove Video"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.videos.length === 0 && (
                    <p className="text-gray-500 text-sm italic text-center py-4 bg-[#1a1a1a]/50 rounded border border-dashed border-gray-700">No videos added yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700 sticky bottom-0 bg-[#1a1a1a] pb-2 z-10">
                <Button type="button" onClick={() => setActiveTab('list')} variant="outline" className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10">
                  {t.admin.actions.cancel}
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-[#d4af37] text-black hover:bg-[#c9a961] min-w-[200px] h-12 text-lg shadow-lg shadow-[#d4af37]/20">
                  {isSaving ? (
                    <><Loader2 className="animate-spin mr-2" /> Saving...</>
                  ) : (
                    <><Save size={20} className="mr-2" /> {editingId ? "Update Property" : "Create Property"}</>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
      <SecurityModal isOpen={showSecurity} onClose={() => setShowSecurity(false)} />
    </>
  );
};

export default AdminPanel;