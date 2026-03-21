/**
 * TipWidget Component
 * Widget for sending tips during live streams with BoohPay integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Heart, TrendingUp, Gift, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sendTip, getEventTips, subscribeToTips } from '@/services/liveStreamingService';
import type { EventTip } from '@/types/events';
import { cn } from '@/lib/utils';

interface TipWidgetProps {
  eventId: string;
  organizerName?: string;
  enabled?: boolean;
  totalTips?: number;
  className?: string;
}

export const TipWidget: React.FC<TipWidgetProps> = ({
  eventId,
  organizerName = 'Organizer',
  enabled = true,
  totalTips = 0,
  className,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [recentTips, setRecentTips] = useState<EventTip[]>([]);
  const [showTipForm, setShowTipForm] = useState(false);

  const predefinedAmounts = [5, 10, 20, 50];

  // Load recent tips
  useEffect(() => {
    loadRecentTips();
  }, [eventId]);

  // Subscribe to new tips
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToTips(eventId, (newTip) => {
      setRecentTips((prev) => [newTip, ...prev].slice(0, 10));
    });

    return unsubscribe;
  }, [eventId, enabled]);

  const loadRecentTips = async () => {
    const tips = await getEventTips(eventId, false);
    setRecentTips(tips.slice(0, 10));
  };

  const handleSendTip = async () => {
    if (sending) return;

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;

    if (finalAmount <= 0 || isNaN(finalAmount)) {
      alert('Please enter a valid amount');
      return;
    }

    if (finalAmount > 1000) {
      alert('Maximum tip amount is 1000€');
      return;
    }

    setSending(true);

    try {
      const userName = user?.user_metadata?.full_name || user?.email || 'Anonymous';
      const userEmail = user?.email;

      const result = await sendTip(
        eventId,
        userName,
        finalAmount,
        'EUR',
        message.trim() || undefined,
        isAnonymous,
        user?.id,
        userEmail
      );

      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.paymentUrl) {
        // Redirect to BoohPay payment page
        window.location.href = result.paymentUrl;
      } else {
        // Free tip (for testing)
        alert('Thank you for your support! 💖');
        setMessage('');
        setCustomAmount('');
        setAmount(5);
        setShowTipForm(false);
        loadRecentTips();
      }
    } catch (error) {
      console.error('Failed to send tip:', error);
      alert('Failed to send tip. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!enabled) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex items-center justify-center h-full p-6">
          <div className="text-center text-gray-500">
            <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Tips are disabled for this event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRaised = useMemo(() => {
    return recentTips.reduce((sum, tip) => sum + tip.amount, 0) || totalTips;
  }, [recentTips, totalTips]);

  return (
    <Card className={cn('flex flex-col h-full bg-white/80 backdrop-blur-xl border-2 border-gray-200/60 shadow-xl rounded-3xl overflow-hidden', className)}>
      <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-red-50 to-pink-50 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          Support {organizerName}
        </CardTitle>
        <CardDescription className="mt-1">
          Send tips to show your appreciation
        </CardDescription>
        {totalRaised > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3 p-2 bg-green-50 rounded-xl border border-green-200"
          >
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Total Raised</p>
              <p className="text-lg font-bold text-green-600">
                {totalRaised.toFixed(2)}€
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />
          </motion.div>
        )}
      </CardHeader>

      {!showTipForm ? (
        <CardContent className="flex-1 p-4 space-y-4">
          {/* Recent tips */}
          {recentTips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Recent Tips
              </h4>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {recentTips.map((tip) => (
                    <RecentTipItem key={tip.id} tip={tip} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Send tip button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowTipForm(true)}
              className="w-full rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg"
              size="lg"
            >
              <Heart className="h-4 w-4 mr-2 fill-white" />
              Send a Tip
            </Button>
          </motion.div>
        </CardContent>
      ) : (
        <CardContent className="flex-1 p-4 space-y-4">
          {/* Amount selection */}
          <div className="space-y-2">
            <Label>Amount (€)</Label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedAmounts.map((preAmount) => (
                <motion.div key={preAmount} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={amount === preAmount && !customAmount ? 'default' : 'outline'}
                    onClick={() => {
                      setAmount(preAmount);
                      setCustomAmount('');
                    }}
                    className={`h-12 rounded-xl ${
                      amount === preAmount && !customAmount
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0'
                        : ''
                    }`}
                  >
                    {preAmount}€
                  </Button>
                </motion.div>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setAmount(0);
              }}
              min="1"
              max="1000"
              step="1"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="tip-message">Message (optional)</Label>
            <Textarea
              id="tip-message"
              placeholder="Add a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
            />
            {message.length > 150 && (
              <p className="text-xs text-gray-500">
                {200 - message.length} characters remaining
              </p>
            )}
          </div>

          {/* Anonymous option */}
          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">Send anonymously</Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTipForm(false);
                setMessage('');
                setCustomAmount('');
                setAmount(5);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={handleSendTip}
                disabled={sending}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Send {customAmount || amount}€
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Recent tip item component
interface RecentTipItemProps {
  tip: EventTip;
}

const RecentTipItem: React.FC<RecentTipItemProps> = ({ tip }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all"
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-yellow-200">
          {getInitials(tip.tipper_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{tip.tipper_name}</span>
          <Badge variant="secondary" className="text-xs">
            <DollarSign className="h-3 w-3 mr-0.5" />
            {tip.amount}€
          </Badge>
        </div>
        {tip.message && (
          <p className="text-sm text-gray-600 mt-1 break-words">{tip.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {formatTimeAgo(tip.created_at)}
        </p>
      </div>

      <Heart className="h-5 w-5 text-red-500 fill-red-500" />
    </motion.div>
  );
};

/**
 * Compact Tip Counter Component
 * For use in event cards or headers
 */
export const TipCounter: React.FC<{ totalAmount: number; className?: string }> = ({
  totalAmount,
  className,
}) => {
  if (totalAmount <= 0) return null;

  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      <span className="font-semibold">{totalAmount.toFixed(2)}€</span>
      <span className="text-gray-500">raised</span>
    </div>
  );
};
