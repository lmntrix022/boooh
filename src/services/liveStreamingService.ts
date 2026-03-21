/**
 * Live Streaming Service
 * Handle live streaming, chat, tips, and viewer tracking
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Event,
  EventChatMessage,
  EventTip,
  EventViewer,
  LiveStreamConfig,
  LiveStreamPlatform,
  LiveStreamStatus,
  ChatMessageType,
} from '@/types/events';

// =====================================================
// STREAM MANAGEMENT
// =====================================================

/**
 * Start a live stream
 */
export async function startLiveStream(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user is the organizer
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event || event.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update event status to live
    const { error } = await supabase
      .from('events')
      .update({
        live_stream_status: 'live',
        live_started_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * End a live stream
 */
export async function endLiveStream(
  eventId: string,
  userId: string,
  replayUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event || event.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('events')
      .update({
        live_stream_status: 'ended',
        live_ended_at: new Date().toISOString(),
        replay_url: replayUrl || null,
      })
      .eq('id', eventId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update live stream configuration
 */
export async function updateLiveStreamConfig(
  eventId: string,
  userId: string,
  config: Partial<LiveStreamConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event || event.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('events')
      .update({
        has_live_stream: config.has_live_stream,
        live_stream_url: config.live_stream_url,
        live_stream_platform: config.live_stream_platform,
        enable_chat: config.enable_chat,
        enable_tips: config.enable_tips,
      })
      .eq('id', eventId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get live stream status
 */
export async function getLiveStreamStatus(
  eventId: string
): Promise<{
  status: LiveStreamStatus;
  current_viewers: number;
  total_tips: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('live_stream_status, current_viewers, total_tips_amount')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    return {
      status: (data.live_stream_status || 'scheduled') as LiveStreamStatus,
      current_viewers: data.current_viewers || 0,
      total_tips: data.total_tips_amount || 0,
    };
  } catch (error) {
    return null;
  }
}

// =====================================================
// CHAT MESSAGES
// =====================================================

/**
 * Send a chat message
 */
export async function sendChatMessage(
  eventId: string,
  userId: string | null,
  userName: string,
  message: string,
  userAvatarUrl?: string,
  messageType: ChatMessageType = 'text'
): Promise<EventChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('event_chat_messages')
      .insert({
        event_id: eventId,
        user_id: userId,
        user_name: userName,
        user_avatar_url: userAvatarUrl,
        message: message.trim(),
        message_type: messageType,
      })
      .select()
      .single();

    if (error) throw error;

    return data as EventChatMessage;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return null;
  }
}

/**
 * Get chat messages (paginated)
 */
export async function getChatMessages(
  eventId: string,
  limit: number = 50,
  offset: number = 0
): Promise<EventChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('event_chat_messages')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data as EventChatMessage[]).reverse();
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
}

/**
 * Delete a chat message (soft delete)
 */
export async function deleteChatMessage(
  messageId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Pin a chat message (organizer only)
 */
export async function pinChatMessage(
  messageId: string,
  eventId: string,
  userId: string,
  pinned: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user is organizer
    const { data: event } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!event || event.user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('event_chat_messages')
      .update({ is_pinned: pinned })
      .eq('id', messageId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to chat messages in real-time
 */
export function subscribeToChatMessages(
  eventId: string,
  callback: (message: EventChatMessage) => void
) {
  const channel = supabase
    .channel(`event_chat_${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_chat_messages',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new as EventChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// TIPS
// =====================================================

/**
 * Send a tip
 */
export async function sendTip(
  eventId: string,
  tipperName: string,
  amount: number,
  currency: string = 'EUR',
  message?: string,
  isAnonymous: boolean = false,
  userId?: string,
  tipperEmail?: string
): Promise<{ tip: EventTip | null; paymentUrl?: string; error?: string }> {
  try {
    // Create tip record
    const { data: tip, error } = await supabase
      .from('event_tips')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        tipper_name: tipperName,
        tipper_email: tipperEmail,
        amount,
        currency,
        message: message?.trim(),
        is_anonymous: isAnonymous,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // If free tip (testing), mark as completed
    if (amount === 0) {
      const { data: completedTip } = await supabase
        .from('event_tips')
        .update({
          payment_status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', tip.id)
        .select()
        .single();

      return { tip: completedTip as EventTip };
    }

    // TODO: Integrate with BoohPay for actual payment
    // const paymentResult = await boohPayService.initiatePayment({...});

    return {
      tip: tip as EventTip,
      // paymentUrl: paymentResult.paymentUrl,
    };
  } catch (error: any) {
    return { tip: null, error: error.message };
  }
}

/**
 * Get tips for an event
 */
export async function getEventTips(
  eventId: string,
  includeAnonymous: boolean = false
): Promise<EventTip[]> {
  try {
    let query = supabase
      .from('event_tips')
      .select('*')
      .eq('event_id', eventId)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false });

    if (!includeAnonymous) {
      query = query.eq('is_anonymous', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as EventTip[];
  } catch (error) {
    console.error('Error fetching tips:', error);
    return [];
  }
}

/**
 * Confirm tip payment (webhook callback)
 */
export async function confirmTipPayment(
  tipId: string,
  transactionId: string,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_tips')
      .update({
        payment_status: 'completed',
        transaction_id: transactionId,
        payment_method: paymentMethod,
        completed_at: new Date().toISOString(),
      })
      .eq('id', tipId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to tips in real-time
 */
export function subscribeToTips(
  eventId: string,
  callback: (tip: EventTip) => void
) {
  const channel = supabase
    .channel(`event_tips_${eventId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'event_tips',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        const tip = payload.new as EventTip;
        if (tip.payment_status === 'completed' && !tip.is_anonymous) {
          callback(tip);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'event_tips',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        const tip = payload.new as EventTip;
        if (tip.payment_status === 'completed' && !tip.is_anonymous) {
          callback(tip);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// VIEWERS TRACKING
// =====================================================

/**
 * Join as viewer
 */
export async function joinAsViewer(
  eventId: string,
  sessionId: string,
  viewerName?: string,
  userId?: string
): Promise<EventViewer | null> {
  try {
    const { data, error } = await supabase
      .from('event_viewers')
      .upsert(
        {
          event_id: eventId,
          session_id: sessionId,
          user_id: userId || null,
          viewer_name: viewerName || 'Anonymous',
          is_anonymous: !userId,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'event_id,session_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return data as EventViewer;
  } catch (error) {
    console.error('Error joining as viewer:', error);
    return null;
  }
}

/**
 * Update viewer heartbeat (keep-alive)
 */
export async function updateViewerHeartbeat(
  eventId: string,
  sessionId: string
): Promise<void> {
  try {
    await supabase
      .from('event_viewers')
      .update({
        last_seen_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('session_id', sessionId);
  } catch (error) {
    console.error('Error updating viewer heartbeat:', error);
  }
}

/**
 * Leave stream
 */
export async function leaveStream(
  eventId: string,
  sessionId: string
): Promise<void> {
  try {
    await supabase
      .from('event_viewers')
      .update({
        left_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('session_id', sessionId);
  } catch (error) {
    console.error('Error leaving stream:', error);
  }
}

/**
 * Get active viewers count
 */
export async function getActiveViewersCount(eventId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_active_viewers_count', {
      event_uuid: eventId,
    });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error('Error getting viewers count:', error);
    return 0;
  }
}

/**
 * Subscribe to viewer count updates
 */
export function subscribeToViewerCount(
  eventId: string,
  callback: (count: number) => void
) {
  const channel = supabase
    .channel(`event_viewers_count_${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_viewers',
        filter: `event_id=eq.${eventId}`,
      },
      async () => {
        const count = await getActiveViewersCount(eventId);
        callback(count);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate session ID for anonymous viewers
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Parse YouTube URL to get video ID
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Parse Twitch URL to get channel name
 */
export function getTwitchChannelName(url: string): string | null {
  const patterns = [
    /twitch\.tv\/([a-zA-Z0-9_]+)/,
    /^([a-zA-Z0-9_]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Get embed URL from stream URL
 */
export function getEmbedUrl(
  streamUrl: string,
  platform: LiveStreamPlatform
): string | null {
  switch (platform) {
    case 'youtube': {
      const videoId = getYouTubeVideoId(streamUrl);
      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`
        : null;
    }

    case 'twitch': {
      const channel = getTwitchChannelName(streamUrl);
      return channel
        ? `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`
        : null;
    }

    case 'facebook': {
      // Facebook Live embed logic
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(streamUrl)}&show_text=false&autoplay=true`;
    }

    case 'custom': {
      return streamUrl;
    }

    default:
      return null;
  }
}
