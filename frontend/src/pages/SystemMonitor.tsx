import { useState, useEffect } from 'react';
import { healthApi } from '../api/health';
import { Server, Database, HardDrive, Activity, AlertTriangle, CheckCircle, Clock, Users, FileText, Receipt } from 'lucide-react';

interface HealthCheck {
  healthy: boolean;
  timestamp: string;
  checks: {
    database: { status: string; message: string };
    storage: { status: string; message: string };
    disk: { status: string; used_percent: number; free_gb: number };
    memory: { status: string; used_mb: number; limit_mb: number };
    app: { environment: string; php_version: string; laravel_version: string; uptime: string };
  };
}

interface SystemStatus {
  users: number;
  companies: number;
  tasks: { total: number; active: number };
  invoices: { total: number; overdue: number };
  storage: { used_percent: number; free_gb: number };
  recent_errors: number;
}

export default function SystemMonitor() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [healthRes, statusRes] = await Promise.all([
        healthApi.getHealth(),
        healthApi.getSystemStatus(),
      ]);
      setHealth(healthRes.data);
      setStatus(statusRes.data.data);
    } catch {
      // Health endpoint might fail if system is down
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
      status === 'ok' ? 'bg-green-100 text-green-700' :
      status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    }`}>
      {status === 'ok' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      {status === 'ok' ? 'سليم' : status === 'warning' ? 'تحذير' : 'خطأ'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مراقبة النظام</h1>
          <p className="text-gray-500 text-sm mt-1">حالة النظام والأداء</p>
        </div>
        <button onClick={() => { setLoading(true); fetchData(); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 transition-colors flex items-center gap-2">
          <Activity size={16} /> تحديث
        </button>
      </div>

      {/* Overall Health */}
      {health && (
        <div className={`rounded-2xl p-6 border ${health.healthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {health.healthy ? (
              <CheckCircle size={32} className="text-green-500" />
            ) : (
              <AlertTriangle size={32} className="text-red-500" />
            )}
            <div>
              <h2 className={`text-xl font-bold ${health.healthy ? 'text-green-700' : 'text-red-700'}`}>
                {health.healthy ? 'النظام يعمل بشكل طبيعي' : 'توجد مشاكل في النظام'}
              </h2>
              <p className="text-sm text-gray-500">آخر فحص: {new Date(health.timestamp).toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Health Checks Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Database */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Database size={20} className="text-blue-500" />
                </div>
                <span className="font-semibold text-gray-700">قاعدة البيانات</span>
              </div>
              <StatusBadge status={health.checks.database.status} />
            </div>
            <p className="text-sm text-gray-500">{health.checks.database.message}</p>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <HardDrive size={20} className="text-purple-500" />
                </div>
                <span className="font-semibold text-gray-700">التخزين</span>
              </div>
              <StatusBadge status={health.checks.disk.status} />
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{health.checks.disk.used_percent}% مستخدم</span>
                <span>{health.checks.disk.free_gb} GB متاح</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${
                  health.checks.disk.used_percent > 90 ? 'bg-red-500' :
                  health.checks.disk.used_percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`} style={{ width: `${health.checks.disk.used_percent}%` }} />
              </div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Server size={20} className="text-green-500" />
                </div>
                <span className="font-semibold text-gray-700">الذاكرة</span>
              </div>
              <StatusBadge status={health.checks.memory.status} />
            </div>
            <p className="text-sm text-gray-500">{health.checks.memory.used_mb} MB / {health.checks.memory.limit_mb} MB</p>
          </div>

          {/* App Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock size={20} className="text-amber-500" />
                </div>
                <span className="font-semibold text-gray-700">التطبيق</span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-500">
              <p>PHP {health.checks.app.php_version}</p>
              <p>Laravel {health.checks.app.laravel_version}</p>
              <p>Uptime: {health.checks.app.uptime}</p>
            </div>
          </div>
        </div>
      )}

      {/* System Statistics */}
      {status && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">إحصائيات النظام</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Users} label="المستخدمين" value={status.users} color="blue" />
            <StatCard icon={Server} label="الشركات" value={status.companies} color="purple" />
            <StatCard icon={FileText} label="المهام النشطة" value={status.tasks.active} color="green" />
            <StatCard icon={FileText} label="إجمالي المهام" value={status.tasks.total} color="gray" />
            <StatCard icon={Receipt} label="الفواتير المتأخرة" value={status.invoices.overdue} color={status.invoices.overdue > 0 ? 'red' : 'green'} />
            <StatCard icon={AlertTriangle} label="أخطاء اليوم" value={status.recent_errors} color={status.recent_errors > 0 ? 'red' : 'green'} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
      <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
