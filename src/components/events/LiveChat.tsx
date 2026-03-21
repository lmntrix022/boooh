/**
 * LiveChat Component
 * Real-time chat for live events using Supabase Realtime
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Pin, Trash2, MessageCircle, Loader2, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  sendChatMessage,
  getChatMessages,
  subscribeToChatMessages,
  deleteChatMessage,
  pinChatMessage,
} from '@/services/liveStreamingService';
import type { EventChatMessage } from '@/types/events';
import { cn } from '@/lib/utils';

interface LiveChatProps {
  eventId: string;
  isOrganizer?: boolean;
  enabled?: boolean;
  className?: string;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  eventId,
  isOrganizer = false,
  enabled = true,
  className,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [eventId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToChatMessages(eventId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    });

    return unsubscribe;
  }, [eventId, enabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    const msgs = await getChatMessages(eventId, 100);
    setMessages(msgs);
    setLoading(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    if (!user) {
      alert('Please sign in to chat');
      return;
    }

    setSending(true);

    try {
      const userName = user.user_metadata?.full_name || user.email || 'Anonymous';
      const userAvatar = user.user_metadata?.avatar_url;

      const sentMessage = await sendChatMessage(
        eventId,
        user.id,
        userName,
        newMessage,
        userAvatar
      );

      if (sentMessage) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    const result = await deleteChatMessage(messageId, user.id);
    if (result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const handlePinMessage = async (messageId: string, pinned: boolean) => {
    if (!user || !isOrganizer) return;

    const result = await pinChatMessage(messageId, eventId, user.id, pinned);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: pinned } : m))
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!enabled) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center h-full p-6">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chat is disabled for this event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate unique users
  const uniqueUsers = useMemo(() => {
    const users = new Set(messages.map(m => m.user_id).filter(Boolean));
    return users.size;
  }, [messages]);

  return (
    <Card className={cn('flex flex-col h-full bg-white/80 backdrop-blur-xl border-2 border-gray-200/60 shadow-xl rounded-3xl overflow-hidden', className)}>
      <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-purple-50 to-blue-50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            Live Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            {uniqueUsers > 0 && (
              <Badge variant="outline" className="rounded-xl">
                <Users className="h-3 w-3 mr-1" />
                {uniqueUsers}
              </Badge>
            )}
            {messages.length > 0 && (
              <Badge className="bg-purple-500 text-white rounded-xl">
                {messages.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center text-gray-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1 text-gray-400">Be the first to say something!</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <ChatMessage
                    message={msg}
                    isOwnMessage={msg.user_id === user?.id}
                    isOrganizer={isOrganizer}
                    onDelete={() => handleDeleteMessage(msg.id)}
                    onPin={(pinned) => handlePinMessage(msg.id, pinned)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <CardContent className="border-t border-gray-200/50 p-4 bg-gray-50/50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              user ? 'Type a message...' : 'Sign in to chat'
            }
            disabled={!user || sending}
            maxLength={500}
            className="flex-1 rounded-xl border-2 border-gray-200 focus:border-purple-400"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSendMessage}
              disabled={!user || !newMessage.trim() || sending}
              size="icon"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
        {newMessage.length > 400 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-amber-600 mt-2 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {500 - newMessage.length} characters remaining
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
};

// Individual chat message component
interface ChatMessageProps {
  message: EventChatMessage;
  isOwnMessage: boolean;
  isOrganizer: boolean;
  onDelete: () => void;
  onPin: (pinned: boolean) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwnMessage,
  isOrganizer,
  onDelete,
  onPin,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Message type styling
  const getMessageStyle = () => {
    switch (message.message_type) {
      case 'system':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'tip':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'group relative p-3 rounded-xl transition-all border',
        message.is_pinned && 'border-2 border-purple-500 bg-purple-50/50',
        !message.is_pinned && getMessageStyle(),
        isOwnMessage && 'bg-blue-50/50 border-blue-200',
        !isOwnMessage && !message.is_pinned && 'bg-white border-gray-200'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Pinned indicator */}
      {message.is_pinned && (
        <div className="absolute -top-2 left-2">
          <Badge className="text-xs" variant="default">
            <Pin className="h-3 w-3 mr-1" />
            Pinned
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.user_avatar_url} />
          <AvatarFallback className="text-xs">
            {getInitials(message.user_name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{message.user_name}</span>
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.message}
          </p>
        </div>

        {/* Actions (show on hover) */}
        {showActions && (isOwnMessage || isOrganizer) && (
          <div className="flex items-center gap-1">
            {isOrganizer && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onPin(!message.is_pinned)}
                title={message.is_pinned ? 'Unpin' : 'Pin message'}
              >
                <Pin
                  className={cn(
                    'h-4 w-4',
                    message.is_pinned && 'fill-current'
                  )}
                />
              </Button>
            )}
            {isOwnMessage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
                title="Delete message"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
