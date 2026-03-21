/**
 * BulkEmailDialog Component
 * Dialog for sending bulk emails to event attendees
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Check } from 'lucide-react';

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendeeCount: number;
  onSend: (subject: string, message: string) => Promise<void>;
}

export const BulkEmailDialog: React.FC<BulkEmailDialogProps> = ({
  open,
  onOpenChange,
  attendeeCount,
  onSend,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    setIsSending(true);
    try {
      await onSend(subject, message);
      setSent(true);
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setSubject('');
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onOpenChange(false);
      setSubject('');
      setMessage('');
      setSent(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to Attendees
          </DialogTitle>
          <DialogDescription>
            Send an email to {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold mb-2">Email Sent Successfully!</p>
            <p className="text-sm text-gray-600">
              {attendeeCount} email{attendeeCount !== 1 ? 's' : ''} sent
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Event update or announcement..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message to attendees..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                rows={8}
                className="rounded-xl resize-none"
              />
              <p className="text-xs text-gray-500">
                Tip: Use a friendly tone and include all relevant event information
              </p>
            </div>
          </div>
        )}

        {!sent && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !message.trim()}
              className="rounded-xl"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send to {attendeeCount}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
