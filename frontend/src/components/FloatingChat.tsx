import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, ArrowRight, Search, Paperclip, Plus, Hash, Users } from 'lucide-react';
import {
  useChatChannels,
  useChatMessages,
  useChatUsers,
  useSendMessage,
  useMarkRead,
  useCreateChannel,
} from '../hooks/useChat';
import { useAuthStore } from '../store/authStore';
import { resolveFileUrl } from './FilePreview';
import type { ChatChannel, ChatMessage } from '../types';

type View = 'list' | 'conversation' | 'new';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letter = (name || '؟').trim().charAt(0);
  return (
    <div
      className="shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 text-white flex items-center justify-center font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </div>
  );
}

export default function FloatingChat({ unreadCount = 0 }: { unreadCount?: number }) {
  const { user } = useAuthStore();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('list');
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const { data: channels = [] } = useChatChannels();
  const { data: messagesData } = useChatMessages(open && view === 'conversation' ? activeChannelId : null);
  const { data: chatUsers = [] } = useChatUsers();
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();
  const createChannel = useCreateChannel();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages: ChatMessage[] = messagesData?.data ?? [];
  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  const channelName = (c: ChatChannel): string =>
    c.type === 'direct' ? c.members.find((m) => m.id !== user?.id)?.name || c.name : c.name;

  // Channels sorted: unread first, then most-recent activity
  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => {
      if ((b.unread_count > 0 ? 1 : 0) !== (a.unread_count > 0 ? 1 : 0)) {
        return (b.unread_count > 0 ? 1 : 0) - (a.unread_count > 0 ? 1 : 0);
      }
      const at = a.latest_message?.created_at ?? a.created_at;
      const bt = b.latest_message?.created_at ?? b.created_at;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
  }, [channels]);

  const filteredUsers = useMemo(
    () => chatUsers.filter((u) => u.id !== user?.id && u.name.toLowerCase().includes(userSearch.trim().toLowerCase())),
    [chatUsers, userSearch, user?.id],
  );

  // Scroll to newest message
  useEffect(() => {
    if (view === 'conversation') endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, view]);

  // Mark channel read when opened
  useEffect(() => {
    if (open && view === 'conversation' && activeChannelId) markRead.mutate(activeChannelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, activeChannelId]);

  if (!user) return null;
  // Avoid duplication with the full chat page
  if (location.pathname.startsWith('/chat')) return null;

  const openChannel = (id: number) => {
    setActiveChannelId(id);
    setView('conversation');
  };

  const startDirect = async (userId: number) => {
    const existing = channels.find(
      (c) =>
        c.type === 'direct' &&
        c.members.length === 2 &&
        c.members.some((m) => m.id === userId) &&
        c.members.some((m) => m.id === user.id),
    );
    if (existing) {
      openChannel(existing.id);
      return;
    }
    try {
      const ch = await createChannel.mutateAsync({ name: '', type: 'direct', member_ids: [userId] });
      openChannel(ch.id);
    } catch {
      /* handled by hook toast */
    }
  };

  const handleSend = () => {
    if (!activeChannelId || (!text.trim() && !attachment)) return;
    const fd = new FormData();
    if (text.trim()) fd.append('body', text.trim());
    if (attachment) fd.append('attachment', attachment);
    sendMessage.mutate({ channelId: activeChannelId, data: fd });
    setText('');
    setAttachment(null);
  };

  return (
    <div dir="rtl" className="fixed left-6 bottom-24 lg:bottom-6 z-[60] print:hidden">
      {/* Panel */}
      {open && (
        <div className="absolute bottom-16 left-0 w-[92vw] max-w-[380px] h-[70vh] max-h-[560px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-l from-primary-600 to-teal-600 text-white shrink-0">
            {view !== 'list' && (
              <button onClick={() => setView('list')} className="hover:bg-white/20 rounded-lg p-1 -mr-1" aria-label="رجوع">
                <ArrowRight size={20} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">
                {view === 'conversation' && activeChannel
                  ? channelName(activeChannel)
                  : view === 'new'
                  ? 'محادثة جديدة'
                  : 'المحادثات'}
              </p>
              {view === 'conversation' && activeChannel && activeChannel.type !== 'direct' && (
                <p className="text-[11px] text-white/70 truncate">{activeChannel.members.length} أعضاء</p>
              )}
            </div>
            {view === 'list' && (
              <button onClick={() => setView('new')} className="hover:bg-white/20 rounded-lg p-1.5" aria-label="محادثة جديدة">
                <Plus size={18} />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1.5" aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {sortedChannels.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 px-6 text-center">
                  <MessageCircle size={40} className="opacity-40" />
                  <p className="text-sm">لا توجد محادثات بعد</p>
                  <button onClick={() => setView('new')} className="text-primary-600 text-sm font-semibold hover:underline">
                    ابدأ محادثة
                  </button>
                </div>
              )}
              {sortedChannels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openChannel(c.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-right border-b border-gray-50 dark:border-slate-700/40"
                >
                  {c.type === 'direct' ? (
                    <Avatar name={channelName(c)} />
                  ) : (
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500">
                      {c.type === 'private' ? <Users size={18} /> : <Hash size={18} />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${c.unread_count > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                        {channelName(c)}
                      </p>
                      {c.latest_message && (
                        <span className="text-[10px] text-gray-400 shrink-0">{formatTime(c.latest_message.created_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-400 truncate">
                        {c.latest_message
                          ? (c.latest_message.body || (c.latest_message.attachment_name ? '📎 مرفق' : ''))
                          : 'لا رسائل'}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {view === 'new' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <div className="relative">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ابحث عن زميل..."
                    className="w-full pr-9 pl-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDirect(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-right"
                >
                  <Avatar name={u.name} size={36} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{u.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{u.role}</p>
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8">لا يوجد مستخدمون</p>
              )}
            </div>
          )}

          {view === 'conversation' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-slate-900/40">
                {messages.map((m) => {
                  const isMe = m.user_id === user.id;
                  const isGroup = activeChannel?.type !== 'direct';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                          isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'
                        }`}
                      >
                        {!isMe && isGroup && (
                          <p className="text-[10px] font-bold text-primary-500 mb-0.5">{m.user?.name}</p>
                        )}
                        {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                        {m.attachment && (
                          <a
                            href={resolveFileUrl(m.attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-1 inline-flex items-center gap-1 text-xs underline ${isMe ? 'text-blue-100' : 'text-primary-600'}`}
                          >
                            <Paperclip size={12} /> {m.attachment_name || 'مرفق'}
                          </a>
                        )}
                        <p className={`text-[10px] mt-0.5 ${isMe ? 'text-blue-100/80' : 'text-gray-400'}`}>{formatTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-8">ابدأ المحادثة بإرسال رسالة 👋</p>
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-gray-100 dark:border-slate-700 p-2 bg-white dark:bg-slate-800">
                {attachment && (
                  <div className="flex items-center justify-between text-xs bg-gray-100 dark:bg-slate-700 rounded-lg px-2 py-1 mb-1.5">
                    <span className="truncate flex items-center gap-1">
                      <Paperclip size={12} /> {attachment.name}
                    </span>
                    <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 p-2 text-gray-400 hover:text-primary-600 rounded-lg"
                    aria-label="إرفاق ملف"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="اكتب رسالة..."
                    className="flex-1 resize-none max-h-24 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() && !attachment}
                    className="shrink-0 w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white flex items-center justify-center transition"
                    aria-label="إرسال"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-teal-600 hover:scale-105 active:scale-95 text-white shadow-xl shadow-primary-600/30 flex items-center justify-center transition-transform"
        aria-label="المحادثات"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
