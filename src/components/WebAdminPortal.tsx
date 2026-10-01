import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Users,
  HardDrive,
  Activity,
  Lock,
  LogOut,
  RefreshCw,
  EyeOff,
  CheckCircle2,
  Clock,
  Smartphone,
} from 'lucide-react';
import {
  adminLoginApi,
  fetchAdminMetricsApi,
  fetchAdminUsersApi,
  fetchAdminAuditLogsApi,
} from '../lib/api';
import { AdminMetrics, AdminUserAccount, AdminAuditLog } from '../types/khata';

interface WebAdminPortalProps {
  onBackToApp: () => void;
}

export const WebAdminPortal: React.FC<WebAdminPortalProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      await adminLoginApi(email.trim(), password);
      setIsAuthenticated(true);
      loadAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Sahi details check karein.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [m, u, a] = await Promise.all([
        fetchAdminMetricsApi(),
        fetchAdminUsersApi(),
        fetchAdminAuditLogsApi(),
      ]);
      setMetrics(m);
      setUsers(u);
      setAuditLogs(a);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
      const interval = setInterval(loadAdminData, 8000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 min-h-[600px] overflow-hidden">
      {/* Top Admin Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              Digital Khata — Web Admin Portal
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800 font-mono">
                SECURE CONSOLE
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              System Administration, Health & Device Session Audits
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-300">
            <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Plaintext Access Enforced</span>
          </div>

          <button
            onClick={onBackToApp}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            App Par Wapas Jayein
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!isAuthenticated ? (
          /* Admin Login Screen */
          <div className="max-w-sm mx-auto my-12 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-600/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Admin Authentication</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your administrative credentials to access the secure management console.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl mb-4">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In To Console'}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-2">
                Admin credentials are configured by the deployment operator.
              </div>
            </form>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="max-w-6xl mx-auto space-y-6">
            {/* E2EE Compliance Notice Card */}
            <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-700 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-200 flex items-center gap-2">
                    Client-encrypted ledger backups
                    <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      AES-256-GCM
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Ledger backups are encrypted in the client before cloud upload. Admin counters are process-local telemetry and do not represent durable Firebase account totals.
                  </div>
                </div>
              </div>

              <button
                onClick={loadAdminData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Telemetry
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {metrics?.totalUsers || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Verified phone sessions</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Active Devices</span>
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {metrics?.activeDevicesCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Authorized client endpoints</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Encrypted Vault Size</span>
                  <HardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {((metrics?.totalEncryptedSyncBytes || 0) / 1024).toFixed(1)} KB
                </div>
                <div className="text-[11px] text-slate-500 mt-1">100% Salted Ciphertext</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Server Health</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  {metrics?.serverStatus || 'HEALTHY'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Uptime: {Math.floor((metrics?.uptimeSeconds || 0) / 60)} mins
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                User Accounts ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-2.5 transition border-b-2 ${
                  activeTab === 'audit'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Security Audit Logs ({auditLogs.length})
              </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'overview' && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Registered Cloud Accounts (Masked Identifiers)</span>
                  <span className="text-[11px] text-slate-500">
                    Showing real authenticated users only
                  </span>
                </div>

                {users.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Abhi tak koi user account create nahi hua hai.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">User ID</th>
                          <th className="px-4 py-3">Mobile (Masked)</th>
                          <th className="px-4 py-3">Devices</th>
                          <th className="px-4 py-3">Ciphertext Size</th>
                          <th className="px-4 py-3">Last Sync</th>
                          <th className="px-4 py-3">Account Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition">
                            <td className="px-4 py-3 font-mono text-slate-400">{u.id}</td>
                            <td className="px-4 py-3 font-semibold text-slate-200">{u.phoneMasked}</td>
                            <td className="px-4 py-3 text-slate-300">
                              <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                                {u.deviceCount} device(s)
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">
                              {(u.encryptedPayloadBytes / 1024).toFixed(1)} KB
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {u.lastSyncAt ? new Date(u.lastSyncAt).toLocaleString('en-IN') : 'No sync yet'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-300">
                  Security Event Audit Logs
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No security events logged yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">User ID</th>
                          <th className="px-4 py-3">Event Type</th>
                          <th className="px-4 py-3">Client Platform</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/40 transition">
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-300">{log.userId}</td>
                            <td className="px-4 py-3 font-semibold text-amber-300">{log.eventType}</td>
                            <td className="px-4 py-3 text-slate-300 uppercase text-[11px]">{log.platform}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  log.status === 'SUCCESS'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
