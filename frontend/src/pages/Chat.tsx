import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Send, Paperclip, Trash2, Users, Hash, X, Search, ArrowRight } from 'lucide-react';
import { useChatChannels, useChatMessages, useChatUsers, useCreateChannel, useSendMessage, useDeleteMessage, useDeleteChannel, useMarkRead } from '../hooks/useChat';
import { useAuthStore } from '../store/authStore';
import type { ChatChannel, ChatMessage } from '../types';

export default function Chat() {
  const { user } = useAuthStore();
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showDM, setShowDM] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: channels = [], isLoading: channelsLoading } = useChatChannels();
  const { data: messagesData } = useChatMessages(activeChannelId);
  const { data: chatUsers = [] } = useChatUsers();
  const createChannel = useCreateChannel();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const deleteChannel = useDeleteChannel();
  const markRead = useMarkRead();

  const messages = messagesData?.data ?? [];
  const activeChannel = channels.find((c: ChatChannel) => c.id === activeChannelId);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (activeChannelId) markRead.mutate(activeChannelId);
  }, [activeChannelId]);

  const handleSend = () => {
    if (!activeChannelId || (!messageText.trim() && !attachment)) return;
    const formData = new FormData();
    if (messageText.trim()) formData.append('body', messageText.trim());
    if (attachment) formData.append('attachment', attachment);
    sendMessage.mutate({ channelId: activeChannelId, data: formData }, {
      onSuccess: () => { setMessageText(''); setAttachment(null); },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const filteredChannels = channels.filter((c: ChatChannel) => {
    if (!searchQuery) return true;
    const name = c.type === 'direct'
      ? c.members.find(m => m.id !== user?.id)?.name || c.name
      : c.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getChannelName = (ch: ChatChannel) => {
    if (ch.type === 'direct') {
      return ch.members.find(m => m.id !== user?.id)?.name || ch.name;
    }
    return ch.name;
  };

  const getChannelIcon = (ch: ChatChannel) => {
    if (ch.type === 'direct') return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">{getChannelName(ch).charAt(0)}</div>;
    if (ch.type === 'private') return <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center"><Users size={16} className="text-yellow-600" /></div>;
    return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Hash size={16} className="text-gray-600" /></div>;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} د`;
    if (diff < 86400000) return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-l border-gray-200 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare size={20} /> المحادثات
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setShowDM(true)} className="p-2 hover:bg-gray-200 rounded-lg transition" title="رسالة مباشرة">
                <Users size={18} />
              </button>
              <button onClick={() => setShowNewChannel(true)} className="p-2 hover:bg-gray-200 rounded-lg transition" title="قناة جديدة">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto">
          {channelsLoading ? (
            <div className="p-4 text-center text-gray-400">جاري التحميل...</div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">لا توجد محادثات</div>
          ) : (
            filteredChannels.map((ch: ChatChannel) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition text-right ${activeChannelId === ch.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}
              >
                {getChannelIcon(ch)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-800 truncate">{getChannelName(ch)}</span>
                    {ch.latest_message && (
                      <span className="text-xs text-gray-400">{formatTime(ch.latest_message.created_at)}</span>
                    )}
                  </div>
                  {ch.latest_message && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {ch.latest_message.user?.name}: {ch.latest_message.body || '📎 مرفق'}
                    </p>
                  )}
                </div>
                {ch.unread_count > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {ch.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {getChannelIcon(activeChannel)}
                <div>
                  <h3 className="font-bold text-gray-800">{getChannelName(activeChannel)}</h3>
                  <p className="text-xs text-gray-500">{activeChannel.members.length} عضو</p>
                </div>
              </div>
              {activeChannel.created_by === user?.id && (
                <button
                  onClick={() => { if (confirm('حذف هذه القناة؟')) { deleteChannel.mutate(activeChannel.id); setActiveChannelId(null); } }}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {[...messages].reverse().map((msg: ChatMessage) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'order-1' : ''}`}>
                      <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                        {!isMe && <p className="text-xs font-bold mb-1 text-blue-600">{msg.user?.name}</p>}
                        {msg.body && <p className="text-sm whitespace-pre-wrap">{msg.body}</p>}
                        {msg.attachment && (
                          <a
                            href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${msg.attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs underline mt-1 block ${isMe ? 'text-blue-100' : 'text-blue-500'}`}
                          >
                            📎 {msg.attachment_name || 'مرفق'}
                          </a>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 mt-1 ${isMe ? '' : 'justify-end'}`}>
                        <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                        {isMe && (
                          <button
                            onClick={() => deleteMessage.mutate({ channelId: activeChannel.id, messageId: msg.id })}
                            className="text-gray-300 hover:text-red-400 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="p-3 border-t border-gray-200 bg-white">
              {attachment && (
                <div className="flex items-center gap-2 mb-2 bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
                  <Paperclip size={14} className="text-blue-500" />
                  <span className="text-blue-700 truncate">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="mr-auto text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالة..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() && !attachment}
                  className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">اختر محادثة أو ابدأ واحدة جديدة</p>
            </div>
          </div>
        )}
      </div>

      {/* New Channel Modal */}
      {showNewChannel && <NewChannelModal users={chatUsers} onClose={() => setShowNewChannel(false)} onCreate={(data) => { createChannel.mutate(data); setShowNewChannel(false); }} />}

      {/* DM Modal */}
      {showDM && <DMModal users={chatUsers} onClose={() => setShowDM(false)} onCreate={(data) => { createChannel.mutate(data, { onSuccess: (ch) => { setActiveChannelId(ch.id); } }); setShowDM(false); }} />}
    </div>
  );
}

function NewChannelModal({ users, onClose, onCreate }: { users: { id: number; name: string; role: string }[]; onClose: () => void; onCreate: (data: { name: string; type: string; description?: string; member_ids: number[] }) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggle = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">قناة جديدة</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="اسم القناة"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="وصف (اختياري)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={() => setType('public')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${type === 'public' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
              عامة
            </button>
            <button onClick={() => setType('private')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${type === 'private' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
              خاصة
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">الأعضاء</label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggle(u.id)} className="rounded" />
                  <span className="text-sm">{u.name}</span>
                  <span className="text-xs text-gray-400 mr-auto">{u.role}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={() => name.trim() && selectedIds.length && onCreate({ name, type, description: description || undefined, member_ids: selectedIds })}
            disabled={!name.trim() || !selectedIds.length}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
          >
            إنشاء القناة
          </button>
        </div>
      </div>
    </div>
  );
}

function DMModal({ users, onClose, onCreate }: { users: { id: number; name: string; role: string }[]; onClose: () => void; onCreate: (data: { name: string; type: string; member_ids: number[] }) => void }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">رسالة مباشرة</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>
        <input
          type="text"
          placeholder="ابحث عن شخص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.map(u => (
            <button
              key={u.id}
              onClick={() => onCreate({ name: `DM-${u.id}`, type: 'direct', member_ids: [u.id] })}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition text-right"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">{u.name.charAt(0)}</div>
              <div className="flex-1">
                <span className="text-sm font-medium">{u.name}</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
