import { useState } from 'react';
import { useSendEmail } from '../hooks/useEmail';
import { Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailCompose() {
  const [form, setForm] = useState({ to: '', subject: '', body: '' });
  const sendEmail = useSendEmail();

  const handleSubmit = () => {
    if (!form.to || !form.subject || !form.body) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    sendEmail.mutate(form, {
      onSuccess: () => setForm({ to: '', subject: '', body: '' }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إرسال بريد إلكتروني</h1>
        <p className="text-sm text-gray-500 mt-1">إرسال بريد إلكتروني للعملاء من المنصة</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى *</label>
              <input
                type="email" value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                placeholder="email@example.com" className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع *</label>
              <input
                type="text" value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="موضوع الرسالة" className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نص الرسالة *</label>
              <textarea
                rows={10} value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="اكتب رسالتك هنا..." className="input w-full"
              />
            </div>
            <div className="flex justify-end">
              <button onClick={handleSubmit} disabled={sendEmail.isPending} className="btn-primary flex items-center gap-2">
                <Send size={16} /> {sendEmail.isPending ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-2">
          <Mail size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">ملاحظة</p>
            <p>يمكنك أيضاً إرسال الفواتير وعروض الأسعار مباشرة من صفحاتها الخاصة. يتم إرسال البريد من المنصة مع تصميم احترافي.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
