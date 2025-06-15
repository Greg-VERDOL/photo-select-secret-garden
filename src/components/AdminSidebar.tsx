
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
import { useTranslation } from 'react-i18next';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const menuItems = [
    {
      title: t('adminSidebar.galleries'),
      value: "galleries",
      icon: FolderOpen,
    },
    {
      title: t('adminSidebar.photoSelections'),
      value: "selections",
      icon: Heart,
    },
  ];

  return (
    <Sidebar className="border-r border-slate-700">
      <SidebarContent className="bg-slate-800 px-6 py-8">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-300 mb-6 text-lg font-medium">{t('adminSidebar.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    className="text-slate-300 hover:bg-slate-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white px-4 py-3 rounded-xl transition-all duration-200 text-base font-medium w-full"
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
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
