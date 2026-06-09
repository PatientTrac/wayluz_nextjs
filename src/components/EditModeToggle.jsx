'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, LogOut, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@/lib/routerAdapter';

const EditModeToggle = () => {
  const { isAuthenticated, isEditMode, toggleEditMode, logout, setEditMode } = useAdminAuth();
  const navigate = useNavigate();

  // Ensure this component is completely invisible if not authenticated
  if (!isAuthenticated) return null;

  const handleLogout = () => {
    // Ensure edit mode is turned off immediately upon logout
    setEditMode(false);
    logout();
    navigate('/');
  };

  return (
    <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#d4af37]/30 rounded-full p-1 pl-3 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mr-2">
        <span className={`w-2 h-2 rounded-full ${isEditMode ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs font-medium text-gray-300 hidden sm:inline-block">
          {isEditMode ? 'Edit Mode ON' : 'Edit Mode OFF'}
        </span>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={toggleEditMode}
        className={`h-7 px-2 rounded-full transition-all ${
          isEditMode 
            ? 'bg-[#d4af37] text-black hover:bg-[#c9a961]' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title={isEditMode ? "Disable Edit Mode" : "Enable Edit Mode"}
      >
        {isEditMode ? <Edit3 size={14} /> : <Eye size={14} />}
      </Button>

      <div className="w-px h-4 bg-[#d4af37]/30 mx-1" />

      <Button
        size="sm"
        variant="ghost"
        onClick={handleLogout}
        className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
        title="Logout"
      >
        <LogOut size={14} />
      </Button>
    </div>
  );
};

export default EditModeToggle;