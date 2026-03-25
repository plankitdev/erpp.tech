import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { googleDriveApi } from '../api/googleDrive';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function GoogleDriveCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setMessage('لم يتم استلام كود التفويض');
      return;
    }

    googleDriveApi.callback(code)
      .then(() => {
        setStatus('success');
        setMessage('تم ربط جوجل درايف بنجاح!');
        // Notify opener and close
        if (window.opener) {
          window.opener.postMessage({ type: 'google-drive-connected' }, '*');
        }
        setTimeout(() => window.close(), 2000);
      })
      .catch(() => {
        setStatus('error');
        setMessage('فشل ربط جوجل درايف');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري ربط جوجل درايف...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-emerald-700 font-medium">{message}</p>
            <p className="text-xs text-gray-400 mt-2">يمكنك إغلاق هذه النافذة</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
