import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Plus, Send, Paperclip, Trash2, Users, Hash, X, Search, ArrowRight, Building2, UserPlus, UserMinus, Lock, Globe, AtSign, Image, Reply, Smile, Pin, PinOff, Pencil, Check, CheckCheck } from 'lucide-react';
import { useChatChannels, useChatMessages, useChatUsers, useCreateChannel, useSendMessage, useEditMessage, useDeleteMessage, useDeleteChannel, useMarkRead, useAddMembers, useRemoveMember, useToggleReaction, useTogglePin, usePinnedMessages, useSearchMessages, useTypingUsers } from '../hooks/useChat';
import { useAuthStore } from '../store/authStore';
import type { ChatChannel, ChatMessage } from '../types';
import { InlinePreview, resolveFileUrl, isPreviewable } from '../components/FilePreview';
import { chatApi } from '../api/chat';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉', '✅', '❌'];

// Render message body with @mentions highlighted and URLs as rich links
function RenderMessageBody({ body, isMe }: { body: string; isMe: boolean }) {
  // Split on @mentions first
  const mentionParts = body.split(/(@\[[^\]]+\]\(\d+\))/g);
  return (
    <p className="text-sm whitespace-pre-wrap">
      {mentionParts.map((part, i) => {
        const match = part.match(/^@\[([^\]]+)\]\((\d+)\)$/);
        if (match) {
          return (
            <span key={i} className={`font-bold ${isMe ? 'text-blue-100 bg-blue-400/30' : 'text-blue-600 bg-blue-50'} rounded px-0.5`}>
              @{match[1]}
            </span>
          );
        }
        // Now split this text part on URLs
        const urlParts = part.split(/(https?:\/\/[^\s<]+)/g);
        return urlParts.map((seg, j) => {
          if (/^https?:\/\//.test(seg)) {
            // Extract domain for display
            let domain = '';
            try { domain = new URL(seg).hostname.replace('www.', ''); } catch { domain = seg; }
            return (
              <a
                key={`${i}-${j}`}
                href={seg}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium transition ${isMe ? 'bg-blue-400/30 text-blue-50 hover:bg-blue-400/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'}`}
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none"><path d="M6.5 10.5L10.5 6.5M7 4.5H4.5a2 2 0 00-2 2V11a2 2 0 002 2h4.5a2 2 0 002-2V8.5M9.5 2.5h4m0 0v4m0-4l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {domain}
              </a>
            );
          }
          return <span key={`${i}-${j}`}>{seg}</span>;
        });
      })}
    </p>
  );
}

export default function Chat() {
  const { user } = useAuthStore();
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showDM, setShowDM] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<number | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: number; body: string } | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [readsMsgId, setReadsMsgId] = useState<number | null>(null);
  const mentionsRef = useRef<{ id: number; name: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: channels = [], isLoading: channelsLoading } = useChatChannels();
  const { data: messagesData } = useChatMessages(activeChannelId);
  const { data: chatUsers = [] } = useChatUsers();
  const { data: pinnedMessages = [] } = usePinnedMessages(activeChannelId);
  const { data: typingUsers = [] } = useTypingUsers(activeChannelId);
  const { data: searchResults = [] } = useSearchMessages(globalSearch, undefined);
  const createChannel = useCreateChannel();
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const deleteChannel = useDeleteChannel();
  const markRead = useMarkRead();
  const addMembers = useAddMembers();
  const removeMember = useRemoveMember();
  const toggleReaction = useToggleReaction();
  const togglePin = useTogglePin();

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

  // Warn before leaving if there's unsent text or attachment
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (messageText.trim() || attachment) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [messageText, attachment]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiPickerMsgId(null);
      }
    };
    if (emojiPickerMsgId !== null) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [emojiPickerMsgId]);

  // Reset reply when switching channels
  useEffect(() => {
    setReplyTo(null);
  }, [activeChannelId]);

  // Build body with mention IDs for the backend
  const buildBodyWithMentions = (text: string): string => {
    let body = text;
    for (const m of mentionsRef.current) {
      body = body.replace(new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\])`, 'g'), `@[${m.name}](${m.id})`);
    }
    return body;
  };

  const handleSend = () => {
    if (!activeChannelId || (!messageText.trim() && !attachment)) return;
    const formData = new FormData();
    if (messageText.trim()) {
      formData.append('body', buildBodyWithMentions(messageText.trim()));
    }
    if (attachment) formData.append('attachment', attachment);
    if (replyTo) formData.append('reply_to_id', String(replyTo.id));
    sendMessage.mutate({ channelId: activeChannelId, data: formData }, {
      onSuccess: () => { setMessageText(''); setAttachment(null); setMentionQuery(null); setReplyTo(null); mentionsRef.current = []; },
    });
  };

  // Mention filtering
  const mentionUsers = useMemo(() => {
    if (mentionQuery === null) return [];
    return chatUsers.filter((u: any) =>
      u.id !== user?.id && u.name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 6);
  }, [mentionQuery, chatUsers, user?.id]);

  const insertMention = useCallback((u: { id: number; name: string }) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const text = messageText;
    // Find the @ that started this mention
    let atPos = cursor - 1;
    while (atPos >= 0 && text[atPos] !== '@') atPos--;
    const before = text.slice(0, atPos);
    const after = text.slice(cursor);
    const mention = `@${u.name} `;
    const newText = before + mention + after;
    setMessageText(newText);
    // Store mention for later body reconstruction
    if (!mentionsRef.current.find(m => m.id === u.id)) {
      mentionsRef.current.push({ id: u.id, name: u.name });
    }
    setMentionQuery(null);
    setMentionIndex(0);
    setTimeout(() => {
      const pos = before.length + mention.length;
      ta.setSelectionRange(pos, pos);
      ta.focus();
    }, 0);
  }, [messageText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageText(val);
    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
    // Send typing indicator (throttled to once per 3s)
    if (activeChannelId && !typingTimerRef.current) {
      chatApi.sendTyping(activeChannelId).catch(() => {});
      typingTimerRef.current = setTimeout(() => { typingTimerRef.current = null; }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Mention navigation
    if (mentionQuery !== null && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => (i + 1) % mentionUsers.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => (i - 1 + mentionUsers.length) % mentionUsers.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionUsers[mentionIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); setMessageText(prev => prev + '\n'); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Clipboard paste handler for images/files
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Give pasted images a readable name
          let fileName = file.name;
          if (fileName === 'image.png' || !fileName) {
            fileName = `pasted-${Date.now()}.${file.type.split('/')[1] || 'png'}`;
          }
          const renamedFile = new File([file], fileName, { type: file.type });
          setAttachment(renamedFile);
        }
        return;
      }
    }
  }, []);

  const filteredChannels = channels.filter((c: ChatChannel) => {
    if (!searchQuery) return true;
    const name = c.type === 'direct'
      ? c.members.find(m => m.id !== user?.id)?.name || c.name
      : c.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const groupedChannels = useMemo(() => {
    if (!isSuperAdmin) return null;
    const groups: Record<string, ChatChannel[]> = {};
    filteredChannels.forEach((ch: ChatChannel) => {
      const companyName = ch.company?.name || 'بدون شركة';
      if (!groups[companyName]) groups[companyName] = [];
      groups[companyName].push(ch);
    });
    return groups;
  }, [filteredChannels, isSuperAdmin]);

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
      <div className="w-72 lg:w-80 shrink-0 border-l border-gray-200 flex flex-col bg-gray-50">
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
          ) : isSuperAdmin && groupedChannels ? (
            Object.entries(groupedChannels).map(([companyName, companyChannels]) => (
              <div key={companyName}>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200 sticky top-0">
                  <Building2 size={14} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-600">{companyName}</span>
                  <span className="text-[10px] text-gray-400 mr-auto">{companyChannels.length}</span>
                </div>
                {companyChannels.map((ch: ChatChannel) => (
                  <ChannelItem key={ch.id} ch={ch} activeChannelId={activeChannelId} onClick={() => setActiveChannelId(ch.id)} getChannelIcon={getChannelIcon} getChannelName={getChannelName} formatTime={formatTime} user={user} />
                ))}
              </div>
            ))
          ) : (
            filteredChannels.map((ch: ChatChannel) => (
              <ChannelItem key={ch.id} ch={ch} activeChannelId={activeChannelId} onClick={() => setActiveChannelId(ch.id)} getChannelIcon={getChannelIcon} getChannelName={getChannelName} formatTime={formatTime} user={user} />
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3 min-w-0">
                {getChannelIcon(activeChannel)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 truncate">{getChannelName(activeChannel)}</h3>
                    {activeChannel.type === 'public' && <Globe size={14} className="text-gray-400 shrink-0" />}
                    {activeChannel.type === 'private' && <Lock size={14} className="text-yellow-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500">{activeChannel.members.length} عضو</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowGlobalSearch(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                  title="بحث في الرسائل"
                >
                  <Search size={18} />
                </button>
                {pinnedMessages.length > 0 && (
                  <button
                    onClick={() => setShowPinned(!showPinned)}
                    className={`p-2 hover:bg-gray-100 rounded-lg transition ${showPinned ? 'text-amber-500 bg-amber-50' : 'text-gray-500'}`}
                    title={`${pinnedMessages.length} رسائل مثبتة`}
                  >
                    <Pin size={18} />
                  </button>
                )}
                {activeChannel.type !== 'direct' && (
                  <button
                    onClick={() => setShowMembers(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                    title="إدارة الأعضاء"
                  >
                    <Users size={18} />
                  </button>
                )}
                {(activeChannel.created_by === user?.id || user?.role === 'super_admin') && (
                  <button
                    onClick={() => { if (confirm('حذف هذه القناة؟')) { deleteChannel.mutate(activeChannel.id); setActiveChannelId(null); } }}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Pinned messages panel */}
            {showPinned && pinnedMessages.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 max-h-40 overflow-y-auto">
                <div className="flex items-center gap-2 mb-1.5">
                  <Pin size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">الرسائل المثبتة ({pinnedMessages.length})</span>
                  <button onClick={() => setShowPinned(false)} className="mr-auto text-amber-400 hover:text-amber-600"><X size={14} /></button>
                </div>
                {pinnedMessages.map((pm: ChatMessage) => (
                  <div key={pm.id} className="bg-white rounded-lg px-3 py-1.5 mb-1 text-sm border border-amber-100 flex items-center gap-2">
                    <span className="font-medium text-amber-800">{pm.user?.name}:</span>
                    <span className="text-gray-700 truncate flex-1">{pm.body || '📎 مرفق'}</span>
                    {(activeChannel?.created_by === user?.id || user?.role === 'super_admin' || user?.role === 'manager' || user?.role === 'company_admin') && (
                      <button onClick={() => togglePin.mutate({ channelId: activeChannel!.id, messageId: pm.id })} className="text-amber-400 hover:text-red-500 shrink-0" title="إلغاء التثبيت">
                        <PinOff size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {[...messages].reverse().map((msg: ChatMessage) => {
                const isMe = msg.user_id === user?.id;
                // Group reactions by emoji
                const reactionGroups = (msg.reactions || []).reduce<Record<string, { count: number; users: string[]; myReaction: boolean }>>((acc, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], myReaction: false };
                  acc[r.emoji].count++;
                  acc[r.emoji].users.push(r.user?.name || '');
                  if (r.user_id === user?.id) acc[r.emoji].myReaction = true;
                  return acc;
                }, {});
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'} group`}>
                    <div className={`max-w-[70%] ${isMe ? 'order-1' : ''}`}>
                      {/* Reply preview */}
                      {msg.reply_to && (
                        <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-r-2 ${isMe ? 'bg-blue-400/20 border-blue-300 text-blue-100' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>
                          <span className="font-bold">{msg.reply_to.user?.name}</span>
                          <p className="truncate mt-0.5">{msg.reply_to.body || (msg.reply_to.attachment_name ? `📎 ${msg.reply_to.attachment_name}` : '📎 مرفق')}</p>
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                        {!isMe && <p className="text-xs font-bold mb-1 text-blue-600">{msg.user?.name}</p>}
                        {editingMsg?.id === msg.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              type="text"
                              value={editingMsg.body}
                              onChange={e => setEditingMsg({ ...editingMsg, body: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { editMessage.mutate({ channelId: activeChannel!.id, messageId: msg.id, body: editingMsg.body }); setEditingMsg(null); }
                                if (e.key === 'Escape') setEditingMsg(null);
                              }}
                              className="flex-1 text-sm bg-transparent border-0 border-b border-white/40 focus:outline-none text-inherit placeholder:text-gray-300"
                            />
                            <button onClick={() => { editMessage.mutate({ channelId: activeChannel!.id, messageId: msg.id, body: editingMsg.body }); setEditingMsg(null); }} className="p-0.5 text-green-300 hover:text-green-100"><Check size={14} /></button>
                            <button onClick={() => setEditingMsg(null)} className="p-0.5 text-red-300 hover:text-red-100"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            {msg.body && <RenderMessageBody body={msg.body} isMe={isMe} />}
                            {msg.is_edited && <span className="text-[10px] opacity-50 mt-0.5 block">معدّلة</span>}
                          </>
                        )}
                        {msg.attachment && (
                          <div className="mt-1">
                            {isPreviewable(msg.attachment_name || msg.attachment) ? (
                              <InlinePreview
                                name={msg.attachment_name || msg.attachment}
                                path={msg.attachment}
                                className="w-40 h-28 rounded-lg mt-1"
                              />
                            ) : (
                              <a
                                href={resolveFileUrl(msg.attachment)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs underline block ${isMe ? 'text-blue-100' : 'text-blue-500'}`}
                              >
                                📎 {msg.attachment_name || 'مرفق'}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Reactions display */}
                      {Object.keys(reactionGroups).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? '' : 'justify-end'}`}>
                          {Object.entries(reactionGroups).map(([emoji, data]) => (
                            <button
                              key={emoji}
                              onClick={() => activeChannelId && toggleReaction.mutate({ channelId: activeChannelId, messageId: msg.id, emoji })}
                              title={data.users.join(', ')}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition ${data.myReaction ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{data.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Action row: time + read receipts + reply + pin + edit + emoji + delete */}
                      <div className={`flex items-center gap-2 mt-1 ${isMe ? '' : 'justify-end'}`}>
                        <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                        {/* Read receipt indicators */}
                        {isMe && (
                          <span
                            className="cursor-pointer"
                            title={msg.reads && msg.reads.length > 0 ? `قرأها: ${msg.reads.filter(r => r.user_id !== user?.id).map(r => r.user?.name).join(', ')}` : 'لم تُقرأ بعد'}
                            onClick={() => setReadsMsgId(readsMsgId === msg.id ? null : msg.id)}
                          >
                            {msg.reads && msg.reads.filter(r => r.user_id !== user?.id).length > 0
                              ? <CheckCheck size={14} className="text-blue-500" />
                              : <Check size={14} className="text-gray-400" />
                            }
                          </span>
                        )}
                        {msg.is_pinned && <Pin size={11} className="text-amber-400" />}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          <button
                            onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                            className="text-gray-300 hover:text-blue-500 transition p-0.5"
                            title="رد"
                          >
                            <Reply size={13} />
                          </button>
                          {/* Pin button — admin/manager/creator */}
                          {(activeChannel?.created_by === user?.id || user?.role === 'super_admin' || user?.role === 'manager' || user?.role === 'company_admin') && (
                            <button
                              onClick={() => activeChannelId && togglePin.mutate({ channelId: activeChannelId, messageId: msg.id })}
                              className={`transition p-0.5 ${msg.is_pinned ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
                              title={msg.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                            >
                              {msg.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                            </button>
                          )}
                          {/* Edit button — own messages only */}
                          {isMe && msg.body && (
                            <button
                              onClick={() => setEditingMsg({ id: msg.id, body: msg.body })}
                              className="text-gray-300 hover:text-green-500 transition p-0.5"
                              title="تعديل"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <div className="relative" ref={emojiPickerMsgId === msg.id ? emojiRef : undefined}>
                            <button
                              onClick={() => setEmojiPickerMsgId(prev => prev === msg.id ? null : msg.id)}
                              className="text-gray-300 hover:text-yellow-500 transition p-0.5"
                              title="تفاعل"
                            >
                              <Smile size={13} />
                            </button>
                            {emojiPickerMsgId === msg.id && (
                              <div className={`absolute bottom-6 ${isMe ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2 flex flex-wrap gap-1 w-52`}>
                                {EMOJI_LIST.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      if (activeChannelId) toggleReaction.mutate({ channelId: activeChannelId, messageId: msg.id, emoji });
                                      setEmojiPickerMsgId(null);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-lg transition"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {isMe && (
                            <button
                              onClick={() => deleteMessage.mutate({ channelId: activeChannel.id, messageId: msg.id })}
                              className="text-gray-300 hover:text-red-400 transition p-0.5"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Read receipts popup */}
                      {readsMsgId === msg.id && msg.reads && msg.reads.filter(r => r.user_id !== user?.id).length > 0 && (
                        <div className={`mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-xs ${isMe ? '' : 'text-left'}`}>
                          <p className="font-bold text-gray-600 mb-1 flex items-center gap-1"><CheckCheck size={12} className="text-blue-500" /> قرأها</p>
                          {msg.reads.filter(r => r.user_id !== user?.id).map(r => (
                            <div key={r.id} className="flex items-center gap-1.5 py-0.5">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[8px] font-bold">{r.user?.name?.charAt(0)}</div>
                              <span className="text-gray-700">{r.user?.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-1.5 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 animate-pulse">
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} بيكتب...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0].name} و ${typingUsers[1].name} بيكتبوا...`
                  : `${typingUsers[0].name} و ${typingUsers.length - 1} آخرين بيكتبوا...`
                }
              </div>
            )}

            {/* Compose */}
            <div className="p-3 border-t border-gray-200 bg-white">
              {/* Reply preview bar */}
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 bg-blue-50 px-3 py-2 rounded-lg text-sm border-r-2 border-blue-400">
                  <Reply size={14} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-blue-600">{replyTo.user?.name}</span>
                    <p className="text-xs text-gray-600 truncate">{replyTo.body || (replyTo.attachment_name ? `📎 ${replyTo.attachment_name}` : '📎 مرفق')}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500 shrink-0"><X size={14} /></button>
                </div>
              )}
              {attachment && (
                <div className="flex items-center gap-2 mb-2 bg-blue-50 px-3 py-1.5 rounded-lg text-sm">
                  <Paperclip size={14} className="text-blue-500" />
                  {attachment.type.startsWith('image/') && (
                    <img src={URL.createObjectURL(attachment)} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <span className="text-blue-700 truncate">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className="mr-auto text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              )}
              <div className="relative">
                {/* Mention dropdown */}
                {mentionQuery !== null && mentionUsers.length > 0 && (
                  <div className="absolute bottom-full mb-1 right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {mentionUsers.map((u: any, i: number) => (
                      <button
                        key={u.id}
                        onClick={() => insertMention(u)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-right transition ${i === mentionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">{u.name.charAt(0)}</div>
                        <span className="text-sm font-medium">{u.name}</span>
                        <span className="text-xs text-gray-400 mr-auto">{u.role}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={e => setAttachment(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition mb-0.5">
                    <Paperclip size={20} />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="اكتب رسالة... اضغط @ للإشارة"
                    rows={1}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 overflow-y-auto"
                    style={{ minHeight: '42px' }}
                    onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px'; }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() && !attachment}
                    className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition mb-0.5"
                  >
                    <Send size={18} />
                  </button>
                </div>
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

      {/* Members Modal */}
      {showMembers && activeChannel && activeChannel.type !== 'direct' && (
        <MembersModal
          channel={activeChannel}
          allUsers={chatUsers}
          currentUserId={user?.id || 0}
          canManage={activeChannel.created_by === user?.id || user?.role === 'super_admin' || user?.role === 'manager'}
          onAddMembers={(ids) => addMembers.mutate({ channelId: activeChannel.id, memberIds: ids })}
          onRemoveMember={(userId) => removeMember.mutate({ channelId: activeChannel.id, userId })}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Search size={18} className="text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="ابحث في كل الرسائل..."
                  className="flex-1 text-sm border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                />
                <button onClick={() => { setShowGlobalSearch(false); setGlobalSearch(''); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {globalSearch.length < 2 ? (
                <p className="text-center text-gray-400 text-sm py-8">اكتب حرفين على الأقل للبحث</p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">لا توجد نتائج</p>
              ) : (
                searchResults.map((msg: any) => (
                  <button
                    key={msg.id}
                    onClick={() => { setActiveChannelId(msg.channel_id); setShowGlobalSearch(false); setGlobalSearch(''); }}
                    className="w-full text-right p-3 hover:bg-gray-50 rounded-xl transition"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-600">{msg.user?.name}</span>
                      {msg.channel && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{msg.channel.name}</span>}
                      <span className="text-[10px] text-gray-400 mr-auto">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{msg.body}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelItem({ ch, activeChannelId, onClick, getChannelIcon, getChannelName, formatTime, user }: {
  ch: ChatChannel; activeChannelId: number | null; onClick: () => void;
  getChannelIcon: (ch: ChatChannel) => React.ReactNode; getChannelName: (ch: ChatChannel) => string;
  formatTime: (d: string) => string; user: any;
}) {
  return (
    <button
      onClick={onClick}
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

function MembersModal({ channel, allUsers, currentUserId, canManage, onAddMembers, onRemoveMember, onClose }: {
  channel: ChatChannel;
  allUsers: { id: number; name: string; role: string }[];
  currentUserId: number;
  canManage: boolean;
  onAddMembers: (ids: number[]) => void;
  onRemoveMember: (userId: number) => void;
  onClose: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const memberIds = channel.members.map(m => m.id);
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id));
  const toggle = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users size={20} />
            أعضاء القناة ({channel.members.length})
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>

        {channel.type === 'public' && (
          <div className="flex items-center gap-2 p-2.5 bg-primary-50 text-primary-700 rounded-lg text-xs mb-3">
            <Globe size={14} />
            <span>قناة عامة - كل موظفين الشركة بيتضافوا تلقائياً</span>
          </div>
        )}

        {/* Current members */}
        <div className="flex-1 overflow-y-auto space-y-1 mb-3">
          {channel.members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                {m.avatar ? <img src={m.avatar} className="w-8 h-8 rounded-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} /> : m.name.charAt(0)}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{m.name}</span>
                {m.id === channel.created_by && <span className="text-[10px] text-gray-400 mr-2">المنشئ</span>}
              </div>
              {canManage && m.id !== currentUserId && m.id !== channel.created_by && (
                <button
                  onClick={() => { if (confirm(`إزالة ${m.name} من القناة؟`)) onRemoveMember(m.id); }}
                  className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition"
                  title="إزالة"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add members section */}
        {canManage && !showAdd && nonMembers.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-primary-300 rounded-xl text-sm text-gray-500 hover:text-primary-600 transition flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            إضافة أعضاء
          </button>
        )}

        {showAdd && (
          <div className="border-t border-gray-100 pt-3 mt-1">
            <p className="text-sm font-medium text-gray-700 mb-2">اختر أعضاء لإضافتهم</p>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1 mb-3">
              {nonMembers.map(u => (
                <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggle(u.id)} className="rounded" />
                  <span className="text-sm">{u.name}</span>
                  <span className="text-xs text-gray-400 mr-auto">{u.role}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { if (selectedIds.length) { onAddMembers(selectedIds); setSelectedIds([]); setShowAdd(false); } }}
                disabled={!selectedIds.length}
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition"
              >
                إضافة ({selectedIds.length})
              </button>
              <button onClick={() => { setShowAdd(false); setSelectedIds([]); }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
