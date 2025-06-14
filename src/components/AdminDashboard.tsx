
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from './AdminSidebar';
import GalleriesTab from './GalleriesTab';
import CustomersTab from './CustomersTab';
import PhotoSelectionsTab from './PhotoSelectionsTab';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('galleries');

  const renderContent = () => {
    switch (activeTab) {
      case 'galleries':
        return <GalleriesTab />;
      case 'customers':
        return <CustomersTab />;
      case 'selections':
        return <PhotoSelectionsTab />;
      default:
        return <GalleriesTab />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full text-white">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <SidebarInset className="flex-1">
          {/* Header */}
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 border-b border-white/10 backdrop-blur-sm bg-white/5"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:bg-slate-700" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-slate-300 mt-1">Manage your photo galleries and clients</p>
                </div>
              </div>
              
              <Button onClick={onLogout} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </motion.header>

          {/* Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
