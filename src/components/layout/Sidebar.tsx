import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const adminNavItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Trainings', path: '/admin/trainings', icon: BookOpen },
  { label: 'Assignments', path: '/admin/assignments', icon: ClipboardList },
  { label: 'Progress', path: '/admin/progress', icon: BarChart3 },
];

const employeeNavItems = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'My Trainings', path: '/employee/trainings', icon: BookOpen },
];

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = user?.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen border-r border-border bg-white flex flex-col',
          'transition-all duration-300 ease-in-out',
          'hidden lg:flex',
          isOpen ? 'w-[235px]' : 'w-16'
        )}
      >
        {/* Brand */}
        <div className={cn('flex items-center h-14 px-3 border-b border-border shrink-0', isOpen ? 'gap-2.5' : 'justify-center')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c52031] text-white shrink-0">
            <GraduationCap size={18} />
          </div>
          {isOpen && (
            <span className="font-semibold text-sm text-gray-900 leading-tight truncate">
              ETM System
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                      'hover:bg-gray-100 hover:text-gray-900',
                      isActive
                        ? 'bg-[#c52031]/10 text-[#c52031]'
                        : 'text-gray-600',
                      !isOpen && 'justify-center px-0'
                    )}
                  >
                    <item.icon
                      size={18}
                      className={cn('shrink-0', isActive ? 'text-[#c52031]' : 'text-gray-500')}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </TooltipTrigger>
                {!isOpen && (
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        <Separator />

        {/* Collapse toggle */}
        <div className={cn('p-2', !isOpen && 'flex justify-center')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
              isOpen ? 'w-full justify-end' : 'w-9 h-9 p-0'
            )}
          >
            {isOpen ? (
              <>
                <ChevronLeft size={16} />
                <span className="text-xs mr-1">Collapse</span>
              </>
            ) : (
              <ChevronRight size={16} />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
