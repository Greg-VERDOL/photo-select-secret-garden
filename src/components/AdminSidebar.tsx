
import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';
import { FolderOpen, Users, Heart } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    {
      title: "Galleries",
      value: "galleries",
      icon: FolderOpen,
    },
    {
      title: "Customers",
      value: "customers", 
      icon: Users,
    },
    {
      title: "Photo Selections",
      value: "selections",
      icon: Heart,
    },
  ];

  return (
    <Sidebar className="border-r border-slate-700">
      <SidebarContent className="bg-slate-800 px-6 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-300 mb-4">Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    className="text-slate-300 hover:bg-slate-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
