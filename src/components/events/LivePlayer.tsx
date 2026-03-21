/**
 * LivePlayer Component
 * Adaptive video player for YouTube, Twitch, Facebook, and custom streams
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Radio, Users, Eye } from 'lucide-react';
import { getEmbedUrl } from '@/services/liveStreamingService';
import type { LiveStreamPlatform, LiveStreamStatus } from '@/types/events';
import { cn } from '@/lib/utils';

interface LivePlayerProps {
  streamUrl: string;
  platform: LiveStreamPlatform;
  status: LiveStreamStatus;
  currentViewers?: number;
  className?: string;
  autoplay?: boolean;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  streamUrl,
  platform,
  status,
  currentViewers = 0,
  className,
  autoplay = true,
}) => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      const url = getEmbedUrl(streamUrl, platform);
      if (!url) {
        setError('Invalid stream URL for the selected platform');
        return;
      }
      setEmbedUrl(url);
    } catch (err) {
      setError('Failed to load stream');
    }
  }, [streamUrl, platform]);

  // Platform-specific logos/icons
  const getPlatformInfo = () => {
    switch (platform) {
      case 'youtube':
        return {
          name: 'YouTube',
          color: 'bg-red-600',
          icon: '▶',
        };
      case 'twitch':
        return {
          name: 'Twitch',
          color: 'bg-purple-600',
          icon: '◆',
        };
      case 'facebook':
        return {
          name: 'Facebook',
          color: 'bg-blue-600',
          icon: 'f',
        };
      case 'custom':
        return {
          name: 'Stream',
          color: 'bg-gray-600',
          icon: '●',
        };
    }
  };

  const platformInfo = getPlatformInfo();

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-600 text-white flex items-center gap-1 animate-pulse">
            <Radio className="h-3 w-3" />
            LIVE
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            Ended
          </Badge>
        );
      case 'replay':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Radio className="h-3 w-3" />
            Replay
          </Badge>
        );
    }
  };

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!embedUrl) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with status and platform */}
      <div className="bg-black/90 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Platform badge */}
          <div
            className={cn(
              'px-2 py-1 rounded text-white text-xs font-semibold flex items-center gap-1',
              platformInfo.color
            )}
          >
            <span>{platformInfo.icon}</span>
            <span>{platformInfo.name}</span>
          </div>

          {/* Status badge */}
          {getStatusBadge()}
        </div>

        {/* Viewers count (only when live) */}
        {status === 'live' && currentViewers > 0 && (
          <div className="flex items-center gap-1 text-white text-sm">
            <Users className="h-4 w-4" />
            <span className="font-semibold">{currentViewers.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Video player */}
      <div className="relative w-full pt-[56.25%] bg-black">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Live Stream"
        />
      </div>

      {/* Stream ended overlay */}
      {status === 'ended' && !streamUrl.includes('replay') && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <Radio className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Stream Ended</h3>
            <p className="text-gray-300">Thank you for watching!</p>
            {currentViewers > 0 && (
              <p className="text-gray-400 mt-2 text-sm">
                Peak viewers: {currentViewers.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Scheduled overlay */}
      {status === 'scheduled' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Stream Scheduled</h3>
            <p className="text-gray-300">The stream will start soon</p>
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * Compact Live Badge Component
 * For use in event cards
 */
export const LiveBadge: React.FC<{ isLive: boolean; viewerCount?: number }> = ({
  isLive,
  viewerCount,
}) => {
  if (!isLive) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-red-600 text-white flex items-center gap-1 animate-pulse">
        <Radio className="h-3 w-3" />
        LIVE
      </Badge>
      {viewerCount && viewerCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span className="font-semibold">{viewerCount.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};
