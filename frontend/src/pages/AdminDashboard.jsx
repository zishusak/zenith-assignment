import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

const StatCard = ({ label, value, icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, admins: 0, active: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const { notifications } = useNotifications();

  useEffect(() => {
    userAPI.getAll({ limit: 5, page: 1 }).then(({ data }) => {
      const users = data.data.users;
      setRecentUsers(users);
      setStats({
        total: data.data.pagination.total,
        admins: users.filter((u) => u.role === 'admin').length,
        active: users.filter((u) => u.isActive).length,
      });
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome to the admin panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats.total} icon="👥" color="bg-blue-900/50" />
        <StatCard label="Admins" value={stats.admins} icon="👑" color="bg-purple-900/50" />
        <StatCard label="Active" value={stats.active} icon="✅" color="bg-green-900/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Users</h2>
            <Link to="/admin/users" className="text-blue-400 text-sm hover:text-blue-300">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-gray-500 text-xs truncate">{u.email}</p>
                </div>
                <span className={u.role === 'admin' ? 'badge-admin' : 'badge-user'}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Live Activity</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Waiting for activity...</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-2.5 bg-gray-800 rounded-lg">
                  <span className="text-sm mt-0.5">
                    {n.type === 'USER_LOGIN' ? '🔐' : n.type === 'USER_CREATED' ? '✅' : n.type === 'USER_UPDATED' ? '✏️' : '🗑️'}
                  </span>
                  <div>
                    <p className="text-gray-200 text-xs">{n.message}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
