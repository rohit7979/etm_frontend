import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Power, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCompanyEmployees,
  createEmployee,
  updateEmployee,
  type CreateEmployeePayload,
} from '../../services/employee.api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const EmployeesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateEmployeePayload>({
    name: '',
    email: '',
    password: '',
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['company-employees'],
    queryFn: fetchCompanyEmployees,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
      toast.success('Employee provisioned successfully!');
      setIsModalOpen(false);
      setForm({ name: '', email: '', password: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to provision employee');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      updateEmployee(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
      toast.success('Employee status updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update employee status');
    },
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {user?.company?.name ? `${user.company.name} Employees` : 'Company Employees'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Provision and manage employee user accounts for your organization.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#c52031] hover:bg-[#a81a28] text-white gap-2 self-start sm:self-auto"
        >
          <UserPlus size={16} /> Add Employee
        </Button>
      </div>

      {/* Filter / Search bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm max-w-md">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
        />
      </div>

      {/* Employees Table */}
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
                  <th className="px-5 py-3.5">Employee Name</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                      No employees found. Click "Add Employee" to onboard your team.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-semibold text-xs">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{emp.name}</div>
                            <div className="text-xs text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {emp.role.toLowerCase()}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={emp.status === 'active' ? 'default' : 'secondary'}
                          className={
                            emp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-50'
                          }
                        >
                          {emp.status || 'active'}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: emp.id,
                              status: emp.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                          className={`h-8 text-xs gap-1.5 ${
                            emp.status === 'active'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power size={14} />
                          {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Add Employee ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                <UserPlus className="text-[#c52031]" size={22} />
                Add New Employee
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createEmployeeMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Employee Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Employee Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEmployeeMutation.isPending}
                  className="bg-[#c52031] hover:bg-[#a81a28] text-white"
                >
                  {createEmployeeMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1.5" /> Adding…
                    </>
                  ) : (
                    'Add Employee'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
