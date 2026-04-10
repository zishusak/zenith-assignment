import React, { useEffect, useState, useCallback } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h3 className="text-white font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const UserForm = ({ initial = {}, onSubmit, loading }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', isActive: true, ...initial });
  const isEdit = !!initial._id;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-300 mb-1">Name</label>
        <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">Email</label>
        <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      {!isEdit && (
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-300 mb-1">Role</label>
        <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {isEdit && (
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-blue-600" />
          <label htmlFor="isActive" className="text-sm text-gray-300">Active</label>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
      </button>
    </form>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll({ page, limit: 10, search: q });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(1); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchUsers(1, e.target.value);
  };

  const handleCreate = async (form) => {
    setFormLoading(true);
    try {
      await userAPI.create(form);
      toast.success('User created!');
      setModal(null);
      fetchUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (form) => {
    setFormLoading(true);
    try {
      await userAPI.update(selected._id, form);
      toast.success('User updated!');
      setModal(null);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await userAPI.delete(selected._id);
      toast.success('User deleted!');
      setModal(null);
      fetchUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} total users</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <span>+</span> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="input-field pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 uppercase font-semibold px-6 py-3">User</th>
                <th className="text-left text-xs text-gray-500 uppercase font-semibold px-6 py-3">Role</th>
                <th className="text-left text-xs text-gray-500 uppercase font-semibold px-6 py-3">Status</th>
                <th className="text-left text-xs text-gray-500 uppercase font-semibold px-6 py-3">Created</th>
                <th className="text-right text-xs text-gray-500 uppercase font-semibold px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-500">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={u.role === 'admin' ? 'badge-admin' : 'badge-user'}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={u.isActive ? 'badge-active' : 'badge-inactive'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelected(u); setModal('edit'); }}
                        className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setSelected(u); setModal('delete'); }}
                        className="text-xs text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modal === 'create' && (
        <Modal title="Create New User" onClose={() => setModal(null)}>
          <UserForm onSubmit={handleCreate} loading={formLoading} />
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && selected && (
        <Modal title="Edit User" onClose={() => setModal(null)}>
          <UserForm initial={selected} onSubmit={handleUpdate} loading={formLoading} />
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <Modal title="Delete User" onClose={() => setModal(null)}>
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-2xl">🗑️</div>
            <div>
              <p className="text-white font-medium">Are you sure?</p>
              <p className="text-gray-400 text-sm mt-1">
                This will permanently delete <span className="text-white font-medium">{selected.name}</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={formLoading} className="btn-danger flex-1">
                {formLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
