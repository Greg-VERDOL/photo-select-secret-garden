
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
import { FolderOpen, Heart } from 'lucide-react';

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
      title: "Photo Selections",
      value: "selections",
      icon: Heart,
    },
  ];

  return (
    <Sidebar className="border-r border-slate-700">
      <SidebarContent className="bg-slate-800 px-8 py-8">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-300 mb-6 text-base">Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    className="text-slate-300 hover:bg-slate-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white px-6 py-4 rounded-lg transition-colors text-base"
                  >
                    <item.icon className="w-5 h-5 mr-4" />
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
