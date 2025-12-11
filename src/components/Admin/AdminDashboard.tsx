import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, UserProfile, AuditLogEntry, UserSession } from '../../lib/supabase-admin';
import { 
  Users, Shield, Activity, Settings, LogOut, UserCheck, 
  UserX, Eye, RefreshCw, AlertCircle, Search, Filter
} from 'lucide-react';
import Button from '../Common/Button';
import Spinner from '../Common/Spinner';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'sessions'>('users');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const userList = await adminService.getUsers();
        setUsers(userList);
      } else if (activeTab === 'logs') {
        const logs = await adminService.getAuditLogs(50);
        setAuditLogs(logs);
      } else if (activeTab === 'sessions' && selectedUser) {
        const sessions = await adminService.getUserSessions(selectedUser.id);
        setUserSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      await adminService.updateUserRole(userId, newRole);
      await adminService.logAction('UPDATE_USER_ROLE', { userId, newRole });
      loadData();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await adminService.toggleUserActive(userId, isActive);
      await adminService.logAction(
        isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        { userId }
      );
      loadData();
    } catch (error) {
      console.error('Failed to toggle user active:', error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await adminService.revokeSession(sessionId);
      await adminService.logAction('REVOKE_SESSION', { sessionId });
      loadData();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const isCurrentUserAdmin = user && users.find(u => u.id === user.id)?.role === 'admin';

  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as: <span className="font-semibold">{user?.email}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold">{users.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-semibold">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-semibold">{userSessions.filter(s => s.is_active).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Audit Logs</p>
                  <p className="text-2xl font-semibold">{auditLogs.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="inline-block h-4 w-4 mr-2" />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'logs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="inline-block h-4 w-4 mr-2" />
                  Audit Logs
                </button>
                <button
                  onClick={() => selectedUser && setActiveTab('sessions')}
                  disabled={!selectedUser}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'sessions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${!selectedUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Eye className="inline-block h-4 w-4 mr-2" />
                  User Sessions
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Refresh Button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                  {selectedUser && activeTab !== 'sessions' && (
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedUser(null)}
                      className="mr-4"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                <Button
                  variant="secondary"
                  onClick={loadData}
                  loading={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Content Area */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : activeTab === 'users' ? (
                <UserManagementTable
                  users={users}
                  selectedUser={selectedUser}
                  onSelectUser={setSelectedUser}
                  onUpdateRole={handleUpdateRole}
                  onToggleActive={handleToggleActive}
                />
              ) : activeTab === 'logs' ? (
                <AuditLogTable logs={auditLogs} />
              ) : (
                <SessionManagementTable
                  sessions={userSessions}
                  onRevokeSession={handleRevokeSession}
                  selectedUser={selectedUser}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// User Management Table Component
const UserManagementTable: React.FC<{
  users: UserProfile[];
  selectedUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  onUpdateRole: (userId: string, role: 'user' | 'admin' | 'moderator') => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
}> = ({ users, selectedUser, onSelectUser, onUpdateRole, onToggleActive }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            User
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Created
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {users.map((user) => (
          <tr 
            key={user.id} 
            className={`hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.full_name || 'No name'}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <select
                value={user.role}
                onChange={(e) => onUpdateRole(user.id, e.target.value as any)}
                className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
              <Button
                variant={user.is_active ? "danger" : "primary"}
                size="sm"
                onClick={() => onToggleActive(user.id, !user.is_active)}
              >
                {user.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Audit Log Table Component
const AuditLogTable: React.FC<{ logs: AuditLogEntry[] }> = ({ logs }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Action
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            User ID
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Details
          </th>
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Timestamp
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {logs.map((log) => (
          <tr key={log.id}>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {log.action}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-900 max-w-xs truncate">
                {JSON.stringify(log.details)}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(log.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Session Management Table Component
const SessionManagementTable: React.FC<{
  sessions: UserSession[];
  onRevokeSession: (sessionId: string) => void;
  selectedUser: UserProfile | null;
}> = ({ sessions, onRevokeSession, selectedUser }) => (
  <div>
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900">
        Sessions for: {selectedUser?.email}
      </h3>
      <p className="text-sm text-gray-600 mt-1">
        Total sessions: {sessions.length} | Active: {sessions.filter(s => s.is_active).length}
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expires
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IP Address
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sessions.map((session) => (
            <tr key={session.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(session.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(session.expires_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  session.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {session.is_active ? 'Active' : 'Revoked'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {session.ip_address || 'Unknown'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {session.is_active && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRevokeSession(session.id)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Revoke
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminDashboard;