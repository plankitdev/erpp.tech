import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Send, Loader2, MessageSquare } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { useChatMessages, useSendMessage } from '../hooks/useChat';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils';
import ProjectTabs from '../components/ProjectTabs';

export default function ProjectChat() {
  const { slug } = useParams();
  const user = useAuthStore(s => s.user);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: ['project-channel', slug],
    queryFn: () => projectsApi.getChannel(slug!).then(r => r.data.data),
    enabled: !!slug,
  });

  const channelId = channel?.id ?? null;
  const { data: messagesRes } = useChatMessages(channelId);
  const messages = [...(messagesRes?.data ?? [])].sort((a, b) => a.id - b.id);
  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !channelId) return;
    const fd = new FormData();
    fd.append('body', text.trim());
    sendMessage.mutate({ channelId, data: fd });
    setText('');
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/projects" className="action-icon text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
        <h1 className="page-title">{channel?.name || 'شات المشروع'}</h1>
      </div>

      {slug && <ProjectTabs slug={slug} />}

      <div className="card flex flex-col h-[62vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {channelLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <MessageSquare size={32} className="opacity-40" />
              <p className="text-sm">لا توجد رسائل بعد — ابدأ المحادثة مع فريق المشروع.</p>
            </div>
          ) : (
            messages.map(m => {
              const mine = m.user_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {m.user?.name?.charAt(0) || '؟'}
                  </div>
                  <div className={`max-w-[75%] ${mine ? 'items-end text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{m.user?.name || 'مستخدم'}</span>
                      <span className="text-[10px] text-gray-400">{formatDateTime(m.created_at)}</span>
                    </div>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                      mine ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'
                    }`}>
                      {m.body}
                      {m.attachment && (
                        <a href={m.attachment} target="_blank" rel="noopener noreferrer" className={`block mt-1 text-xs underline ${mine ? 'text-white/90' : 'text-primary-600'}`}>
                          {m.attachment_name || 'مرفق'}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-gray-200 dark:border-slate-700">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="اكتب رسالة لفريق المشروع..."
            className="input flex-1"
            disabled={!channelId}
          />
          <button type="submit" disabled={!text.trim() || !channelId || sendMessage.isPending} className="btn-primary px-4">
            {sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
