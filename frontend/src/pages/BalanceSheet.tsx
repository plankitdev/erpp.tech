import { useState } from 'react';
import { useBalanceSheet } from '../hooks/useFinancial';
import { Scale, Download, RefreshCw } from 'lucide-react';
import { SkeletonTable } from '../components/Skeletons';

export default function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: bsData, isLoading, isError, refetch } = useBalanceSheet({ date: asOfDate });

  const bs = bsData as any;
  const assets = bs?.assets ?? {};
  const liabilities = bs?.liabilities ?? {};
  const equity = bs?.equity ?? {};

  const fmt = (n: number) => Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 });

  const renderSection = (title: string, items: Record<string, number>, total: number, color: string) => (
    <div className="card overflow-hidden">
      <div className={`px-4 py-3 border-b border-gray-100 bg-gradient-to-l from-${color}-50 to-transparent`}>
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {Object.entries(items).filter(([k]) => k !== 'total').map(([key, value]) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] text-gray-600">{key}</span>
            <span className="font-semibold text-gray-900 text-[14px]">{fmt(value as number)}</span>
          </div>
        ))}
      </div>
      <div className={`px-4 py-3 bg-${color}-50/50 border-t border-${color}-100 flex items-center justify-between`}>
        <span className="font-bold text-gray-800">الإجمالي</span>
        <span className={`font-bold text-lg text-${color}-700`}>{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">الميزانية العمومية</h1>
          <p className="page-subtitle">المركز المالي — الأصول والالتزامات وحقوق الملكية</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">كما في:</label>
            <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="input w-40" />
          </div>
          <button onClick={() => refetch()} className="btn-icon" title="تحديث"><RefreshCw size={16} /></button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} cols={3} />
      ) : isError ? (
        <div className="card card-body text-center py-12">
          <p className="text-red-400 mb-2">حدث خطأ في تحميل الميزانية</p>
          <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
        </div>
      ) : (
        <>
          {/* Balance equation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div className="stat-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">إجمالي الأصول</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(assets.total)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">إجمالي الالتزامات</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{fmt(liabilities.total)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">حقوق الملكية</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(equity.total)}</p>
            </div>
          </div>

          {/* Check balance */}
          {bs && (
            <div className={`card card-body flex items-center gap-3 ${Math.abs((assets.total || 0) - ((liabilities.total || 0) + (equity.total || 0))) < 0.01 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <Scale size={20} className={Math.abs((assets.total || 0) - ((liabilities.total || 0) + (equity.total || 0))) < 0.01 ? 'text-emerald-600' : 'text-red-600'} />
              <span className={`text-sm font-medium ${Math.abs((assets.total || 0) - ((liabilities.total || 0) + (equity.total || 0))) < 0.01 ? 'text-emerald-700' : 'text-red-700'}`}>
                {Math.abs((assets.total || 0) - ((liabilities.total || 0) + (equity.total || 0))) < 0.01
                  ? 'الميزانية متوازنة — الأصول = الالتزامات + حقوق الملكية'
                  : `الميزانية غير متوازنة — الفرق: ${fmt(Math.abs((assets.total || 0) - ((liabilities.total || 0) + (equity.total || 0))))}`
                }
              </span>
            </div>
          )}

          {/* Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {renderSection('الأصول', assets, assets.total || 0, 'blue')}
            {renderSection('الالتزامات', liabilities, liabilities.total || 0, 'red')}
            {renderSection('حقوق الملكية', equity, equity.total || 0, 'emerald')}
          </div>
        </>
      )}
    </div>
  );
}
