'use client';

import { useState, useEffect } from 'react';
import { api, type Campaign, type Message } from '@/lib/api';
import { Loader2, Inbox, MessageSquare, Phone, Mail, Globe, CheckCircle2, Eye, MousePointerClick } from 'lucide-react';
import { clsx } from 'clsx';

function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  switch (channel) {
    case 'whatsapp': return <MessageSquare className={className} />;
    case 'sms': return <Phone className={className} />;
    case 'email': return <Mail className={className} />;
    case 'rcs': return <Globe className={className} />;
    default: return <MessageSquare className={className} />;
  }
}

export default function ProviderInboxPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; channel: string }>>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  // Track actions locally for instant UI updates
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      const res = await api.inbox.list(selectedCampaignId ?? undefined);
      if (res.success) {
        setCampaigns(res.data.campaigns);
        setMessages(res.data.messages);
        
        if (!selectedCampaignId && res.data.campaigns.length > 0) {
          setSelectedCampaignId(res.data.campaigns[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [selectedCampaignId]);

  const handleOpen = async (msgId: string) => {
    setActionLoading(prev => ({ ...prev, [msgId]: true }));
    try {
      await api.inbox.open(msgId);
      // Optimistic update
      setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, status: 'opened' } : m));
    } catch (e) {
      alert('Failed to open message');
    } finally {
      setActionLoading(prev => ({ ...prev, [msgId]: false }));
    }
  };

  const handleClick = async (msgId: string) => {
    setActionLoading(prev => ({ ...prev, [msgId]: true }));
    try {
      await api.inbox.click(msgId);
      // Optimistic update
      setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, status: 'clicked' } : m));
    } catch (e) {
      alert('Failed to click link');
    } finally {
      setActionLoading(prev => ({ ...prev, [msgId]: false }));
    }
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Filter messages for selected campaign (or show all if none selected but there are some)
  const displayMessages = selectedCampaignId 
    ? messages.filter(m => m.campaignId === selectedCampaignId)
    : messages;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 animate-slide-up">
      {/* Left sidebar: Campaigns List */}
      <div className="w-80 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="h-6 w-6 text-pink-400" /> Provider Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">Simulate user actions on live campaigns</p>
        </div>

        <div className="glass flex-1 overflow-y-auto p-4 space-y-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-10">No live campaigns found.</p>
          ) : (
            campaigns.map(c => {
              // Count unread (sent) messages
              const unread = messages.filter(m => m.campaignId === c.id && m.status === 'sent').length;
              const isSelected = selectedCampaignId === c.id;
              
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-xl transition-all duration-150 border',
                    isSelected 
                      ? 'border-pink-500/50 bg-pink-500/10 shadow-lg shadow-pink-900/20' 
                      : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className={clsx("text-sm font-semibold truncate pr-2", isSelected ? 'text-white' : 'text-slate-300')}>
                      {c.name}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ChannelIcon channel={c.channel} className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-400 capitalize">{c.channel}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right area: Messages */}
      <div className="flex-1 glass p-6 overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-6">Messages</h2>
        
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Inbox className="h-12 w-12 opacity-20 mb-3" />
            <p>No messages in this campaign yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {displayMessages.map(msg => (
              <div key={msg.id} className="bg-surface-800 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-surface-700 flex items-center justify-center">
                        <ChannelIcon channel={msg.channel} className="h-4 w-4 text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{msg.recipientContact}</p>
                        <p className="text-[10px] text-slate-500">Customer ID: {msg.customerId.substring(0, 8)}</p>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className={clsx(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                      msg.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                      msg.status === 'opened' ? 'bg-purple-500/20 text-purple-400' :
                      msg.status === 'clicked' ? 'bg-pink-500/20 text-pink-400' :
                      'bg-slate-500/20 text-slate-400'
                    )}>
                      {msg.status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                      {msg.status === 'opened' && <Eye className="h-3 w-3" />}
                      {msg.status === 'clicked' && <MousePointerClick className="h-3 w-3" />}
                      {msg.status}
                    </div>
                  </div>
                  
                  <div className={clsx(
                    "p-3 rounded-lg text-sm whitespace-pre-wrap font-mono",
                    msg.status === 'sent' ? 'bg-surface-900/50 text-slate-500 blur-sm select-none' : 'bg-brand-500/10 text-brand-100 border border-brand-500/20'
                  )}>
                    {msg.messageBody}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                  {msg.status === 'sent' && (
                    <button
                      onClick={() => handleOpen(msg.id)}
                      disabled={actionLoading[msg.id]}
                      className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading[msg.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      Open Message
                    </button>
                  )}
                  
                  {(msg.status === 'opened' || msg.status === 'delivered') && (
                    <button
                      onClick={() => handleClick(msg.id)}
                      disabled={actionLoading[msg.id]}
                      className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-900/30"
                    >
                      {actionLoading[msg.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <MousePointerClick className="h-4 w-4" />}
                      Click Link
                    </button>
                  )}

                  {msg.status === 'clicked' && (
                    <div className="flex-1 py-2 bg-surface-900 text-slate-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Converted
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
