import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList,
  BarChart3, ChevronLeft, ChevronRight, GraduationCap, X,
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
  { label: 'Dashboard',   path: '/admin/dashboard',   icon: LayoutDashboard },
  { label: 'Trainings',   path: '/admin/trainings',   icon: BookOpen        },
  { label: 'Assignments', path: '/admin/assignments', icon: ClipboardList   },
  { label: 'Progress',    path: '/admin/progress',    icon: BarChart3       },
];

const employeeNavItems = [
  { label: 'Dashboard',    path: '/employee/dashboard',    icon: LayoutDashboard },
  { label: 'My Trainings', path: '/employee/my-trainings', icon: BookOpen        },
  { label: 'My Progress',  path: '/employee/my-progress',  icon: BarChart3       },
];

// ─── Shared nav list (used in both desktop sidebar and mobile drawer) ─────────
const NavList = ({
  items,
  collapsed,
  onNavigate,
}: {
  items: typeof adminNavItems;
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const location = useLocation();
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
      {items.map((item) => {
        const isActive =
          location.pathname === item.path ||
          location.pathname.startsWith(item.path + '/');

        return (
          <Tooltip key={item.path} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  'hover:bg-gray-100 hover:text-gray-900',
                  isActive ? 'bg-[#c52031]/10 text-[#c52031]' : 'text-gray-600',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon
                  size={18}
                  className={cn('shrink-0', isActive ? 'text-[#c52031]' : 'text-gray-500')}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </nav>
  );
};

// ─── Brand logo block ─────────────────────────────────────────────────────────
const Brand = ({ collapsed }: { collapsed: boolean }) => (
  <div className={cn('flex items-center h-14 px-3 border-b border-border shrink-0', collapsed ? 'justify-center' : 'gap-2.5')}>
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c52031] text-white shrink-0">
      <GraduationCap size={18} />
    </div>
    {!collapsed && (
      <span className="font-semibold text-sm text-gray-900 leading-tight truncate">
        ETM System
      </span>
    )}
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user } = useAuth();
  const navItems = user?.role === 'admin' ? adminNavItems : employeeNavItems;

  // Close mobile drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setIsOpen]);

  return (
    <>
      {/* ── Mobile drawer backdrop ──────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen border-r border-border bg-white flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:hidden w-[235px]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Brand collapsed={false} />

        {/* Close button — mobile only */}
        <button
          className="absolute top-3.5 right-3 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>

        <NavList items={navItems} collapsed={false} onNavigate={() => setIsOpen(false)} />
        <Separator />
      </aside>

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen border-r border-border bg-white flex-col',
          'transition-all duration-300 ease-in-out',
          'hidden lg:flex',
          isOpen ? 'w-[235px]' : 'w-16'
        )}
      >
        <Brand collapsed={!isOpen} />

        <NavList items={navItems} collapsed={!isOpen} />

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
