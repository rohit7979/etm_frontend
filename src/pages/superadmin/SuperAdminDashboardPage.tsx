import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Users, ShieldCheck, Plus, ArrowRight, Activity } from 'lucide-react';
import { fetchCompanies } from '../../services/company.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SuperAdminDashboardPage = () => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['superadmin-companies'],
    queryFn: fetchCompanies,
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.status === 'active').length;
  const totalAdmins = companies.reduce((acc, c) => acc + (c.stats?.adminCount || 0), 0);
  const totalEmployees = companies.reduce((acc, c) => acc + (c.stats?.employeeCount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ETM Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage multi-tenant client companies, track platform capacity and provision company administrators.
          </p>
        </div>
        <Link to="/super-admin/companies">
          <Button className="bg-[#c52031] hover:bg-[#a81a28] text-white gap-2">
            <Plus size={16} /> Create Company
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 text-[#c52031] flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Companies</p>
            <p className="text-2xl font-bold text-gray-900">{totalCompanies}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Tenants</p>
            <p className="text-2xl font-bold text-gray-900">{activeCompanies}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company Admins</p>
            <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Employees</p>
            <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
          </div>
        </div>
      </div>

      {/* Companies Quick View */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Provisioned Client Companies</h2>
            <p className="text-xs text-gray-500 mt-0.5">Showing recently onboarded company tenants</p>
          </div>
          <Link to="/super-admin/companies">
            <Button variant="ghost" size="sm" className="text-[#c52031] hover:text-[#a81a28] gap-1.5 text-xs font-medium">
              View all companies <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Admins</th>
                <th className="px-5 py-3">Employees</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No client companies created yet. Click "Create Company" to provision your first tenant.
                  </td>
                </tr>
              ) : (
                companies.slice(0, 5).map((comp) => (
                  <tr key={comp._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{comp.name}</div>
                      <div className="text-xs text-gray-500">{comp.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={comp.status === 'active' ? 'default' : 'secondary'}
                        className={
                          comp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                            : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {comp.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">
                      {comp.stats?.adminCount || 0}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">
                      {comp.stats?.employeeCount || 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to="/super-admin/companies">
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          Manage
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
