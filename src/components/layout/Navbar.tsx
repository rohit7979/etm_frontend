import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const Navbar = ({ toggleSidebar, isSidebarOpen }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatRole = (role?: string) => {
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'COMPANY_ADMIN' || role === 'admin') return 'Company Admin';
    return 'Employee';
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 h-14 border-b border-border bg-white">
      <div
        className="flex items-center justify-between h-full px-4"
      >
        {/* Left: sidebar toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-900 h-9 w-9"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu size={20} />
          </Button>
          <span className="text-sm font-semibold text-gray-800 hidden sm:block">
            Employee Training Management
          </span>
        </div>

        {/* Right: user menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 hover:bg-gray-100"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[#c52031] text-white text-xs font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-xs font-medium text-gray-900">{user.name}</span>
                </div>
                {user.company && (
                  <Badge
                    variant="outline"
                    className="hidden md:inline-flex text-[10px] px-1.5 py-0 border-indigo-200 text-indigo-700 bg-indigo-50 font-medium"
                  >
                    {user.company.name}
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex text-[10px] px-1.5 py-0"
                >
                  {formatRole(user.role)}
                </Badge>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User size={14} className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut size={14} className="mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Navbar;
