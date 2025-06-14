
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import ClientGallery from '@/components/ClientGallery';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';

const Index = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <Routes>
        <Route path="/" element={<ClientGallery />} />
        <Route path="/gallery/:galleryId" element={<ClientGallery />} />
        <Route 
          path="/admin" 
          element={
            isAdmin ? (
              <AdminDashboard />
            ) : (
              <AdminLogin onLogin={() => setIsAdmin(true)} />
            )
          } 
        />
      </Routes>
      <Toaster />
    </div>
  );
};

export default Index;
