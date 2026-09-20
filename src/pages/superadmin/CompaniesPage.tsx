import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  ShieldCheck,
  Search,
  UserPlus,
  Power,
  Loader2,
  X,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCompanies,
  createCompany,
  updateCompanyStatus,
  createCompanyAdmin,
  fetchCompanyAdmins,
  type CreateCompanyPayload,
  type CreateAdminPayload,
} from '../../services/company.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Company } from '../../types';

export const CompaniesPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isViewAdminsModalOpen, setIsViewAdminsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form states
  const [companyForm, setCompanyForm] = useState<CreateCompanyPayload>({ name: '', email: '' });
  const [adminForm, setAdminForm] = useState<CreateAdminPayload>({ name: '', email: '' });

  // Query: Companies
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['superadmin-companies'],
    queryFn: fetchCompanies,
  });

  // Query: Admins of selected company
  const { data: selectedAdmins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['company-admins', selectedCompany?._id],
    queryFn: () => (selectedCompany ? fetchCompanyAdmins(selectedCompany._id) : Promise.resolve([])),
    enabled: !!selectedCompany && isViewAdminsModalOpen,
  });

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-companies'] });
      toast.success('Company created successfully!');
      setIsCompanyModalOpen(false);
      setCompanyForm({ name: '', email: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create company');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      updateCompanyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-companies'] });
      toast.success('Company status updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update company status');
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: CreateAdminPayload }) =>
      createCompanyAdmin(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-companies'] });
      if (selectedCompany) {
        queryClient.invalidateQueries({ queryKey: ['company-admins', selectedCompany._id] });
      }
      toast.success('Invitation sent! Admin received an email to set their password.');
      setIsAdminModalOpen(false);
      setAdminForm({ name: '', email: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to provision admin');
    },
  });

  const handleOpenAdminModal = (company: Company) => {
    setSelectedCompany(company);
    setIsAdminModalOpen(true);
  };

  const handleOpenViewAdminsModal = (company: Company) => {
    setSelectedCompany(company);
    setIsViewAdminsModalOpen(true);
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStatusBadge = (status?: string) => {
    if (status === 'PENDING_INVITE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} /> Invited
        </span>
      );
    }
    if (status === 'ACTIVE' || status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        <Ban size={12} /> Deactivated
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Client Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage multi-tenant company accounts, track administrator invite statuses, and provision tenant admins.
          </p>
        </div>
        <Button
          onClick={() => setIsCompanyModalOpen(true)}
          className="bg-[#c52031] hover:bg-[#a81a28] text-white gap-2 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Company
        </Button>
      </div>

      {/* Filter / Search bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm max-w-md">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by company name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
        />
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Company Name</th>
                  <th className="px-5 py-3.5">Company Status</th>
                  <th className="px-5 py-3.5">Admins (Status)</th>
                  <th className="px-5 py-3.5">Employees</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      No companies match your search.
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-red-50 text-[#c52031] flex items-center justify-center shrink-0 font-bold text-sm">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{company.name}</div>
                            <div className="text-xs text-gray-500">{company.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={company.status === 'active' ? 'default' : 'secondary'}
                          className={
                            company.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-50'
                          }
                        >
                          {company.status}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-700">
                        <button
                          onClick={() => handleOpenViewAdminsModal(company)}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                          title="Click to view company admins"
                        >
                          <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                            <ShieldCheck size={16} />
                            <span>{company.stats?.adminCount || 0}</span>
                          </div>
                          {company.stats?.pendingAdminCount ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              {company.stats.pendingAdminCount} Invited
                            </span>
                          ) : null}
                          {company.stats?.activeAdminCount ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {company.stats.activeAdminCount} Active
                            </span>
                          ) : null}
                        </button>
                      </td>

                      <td className="px-5 py-4 font-medium text-gray-700">
                        {company.stats?.employeeCount || 0}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdminModal(company)}
                            disabled={company.status !== 'active'}
                            className="h-8 text-xs gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            <UserPlus size={14} /> Provision Admin
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: company._id,
                                status: company.status === 'active' ? 'inactive' : 'active',
                              })
                            }
                            className={`h-8 text-xs gap-1.5 ${
                              company.status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power size={14} />
                            {company.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Create Company ── */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                <Building2 className="text-[#c52031]" size={22} />
                Create New Company
              </div>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCompanyMutation.mutate(companyForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Official Company Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@acme.com"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCompanyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  className="bg-[#c52031] hover:bg-[#a81a28] text-white"
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1.5" /> Creating…
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Provision Company Admin (Invite-Based Flow) ── */}
      {isAdminModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                <UserPlus className="text-blue-600" size={22} />
                Provision Admin for {selectedCompany.name}
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2.5">
              <Mail className="shrink-0 text-blue-600 mt-0.5" size={16} />
              <div>
                <p className="font-semibold mb-0.5">Secure Invite Flow via Resend</p>
                <p className="text-blue-700 leading-relaxed">
                  No temporary passwords needed. An invitation link will be sent directly to the administrator's email allowing them to securely set their own password.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAdminMutation.mutate({
                  companyId: selectedCompany._id,
                  payload: adminForm,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@acme.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAdminModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {createAdminMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending Invite…
                    </>
                  ) : (
                    <>
                      <Mail size={15} /> Send Invite Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: View Company Admins & Status ── */}
      {isViewAdminsModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                <ShieldCheck className="text-blue-600" size={22} />
                Administrators — {selectedCompany.name}
              </div>
              <button
                onClick={() => setIsViewAdminsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {isLoadingAdmins ? (
              <div className="py-12 flex justify-center">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : selectedAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>No administrators provisioned yet for this company.</p>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsViewAdminsModalOpen(false);
                    setIsAdminModalOpen(true);
                  }}
                  className="mt-3 bg-blue-600 text-white text-xs gap-1.5"
                >
                  <UserPlus size={14} /> Provision First Admin
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {selectedAdmins.map((admin: any) => (
                  <div key={admin._id || admin.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{admin.name}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                    <div>
                      {renderStatusBadge(admin.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsViewAdminsModalOpen(false);
                  setIsAdminModalOpen(true);
                }}
                className="text-xs text-blue-600 gap-1.5"
              >
                <UserPlus size={14} /> Invite Another Admin
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewAdminsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
