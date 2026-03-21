/**
 * SocialShareButtons Component
 * Social media sharing buttons for events
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  Check,
  QrCode,
} from 'lucide-react';
import type { Event } from '@/types/events';
import QRCode from 'qrcode';

interface SocialShareButtonsProps {
  event: Event;
  url?: string;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  event,
  url = window.location.href,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);

  const shareText = `Check out this event: ${event.title}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodedText}%20${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || shareText,
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to opening dialog
      setShowDialog(true);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  React.useEffect(() => {
    if (showDialog) {
      generateQRCode();
    }
  }, [showDialog]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={handleNativeShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Event
          </DialogTitle>
          <DialogDescription>
            Share this event with your friends and colleagues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start"
              onClick={() => openShareWindow(shareLinks.facebook)}
            >
              <Facebook className="h-4 w-4 mr-2 text-blue-600" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start"
              onClick={() => openShareWindow(shareLinks.twitter)}
            >
              <Twitter className="h-4 w-4 mr-2 text-sky-500" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start"
              onClick={() => openShareWindow(shareLinks.linkedin)}
            >
              <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start"
              onClick={() => openShareWindow(shareLinks.whatsapp)}
            >
              <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start col-span-2"
              onClick={() => window.location.href = shareLinks.email}
            >
              <Mail className="h-4 w-4 mr-2 text-gray-600" />
              Email
            </Button>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Link</label>
            <div className="flex gap-2">
              <Input
                value={url}
                readOnly
                className="flex-1 rounded-xl"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant={copied ? 'default' : 'outline'}
                className="rounded-xl"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </label>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                <img src={qrCodeUrl} alt="Event QR Code" className="w-48 h-48" />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Scan this QR code to access the event
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-xl"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
                    link.href = qrCodeUrl;
                    link.click();
                  }}
                >
                  Download QR Code
                </Button>
              </div>
            </div>
          )}

          {/* Share Stats */}
          <div className="flex gap-2 justify-center">
            <Badge variant="outline" className="rounded-xl">
              {event.current_attendees || 0} attending
            </Badge>
            {event.view_count && (
              <Badge variant="outline" className="rounded-xl">
                {event.view_count} views
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
