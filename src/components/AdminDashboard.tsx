
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Image, Heart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import GalleriesTab from './GalleriesTab';
import PhotoSelectionsTab from './PhotoSelectionsTab';
import SettingsTab from './SettingsTab';
import { useTranslation } from 'react-i18next';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('galleries');
  const { t } = useTranslation();

  const tabs = [
    { id: 'galleries', label: t('adminDashboard.galleriesTab'), icon: Image },
    { id: 'selections', label: t('adminDashboard.selectionsTab'), icon: Heart },
    { id: 'settings', label: t('adminDashboard.settingsTab'), icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'galleries':
        return <GalleriesTab />;
      case 'selections':
        return <PhotoSelectionsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <GalleriesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('adminDashboard.title')}
              </h1>
              <p className="text-slate-300 text-sm">{t('adminDashboard.subtitle')}</p>
            </div>
            
            <Button
              onClick={onLogout}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('adminDashboard.signOutButton')}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl p-2 mb-8">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
