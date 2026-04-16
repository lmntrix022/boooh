/**
 * TicketingWidget Component - Version Premium
 * Enhanced ticket selection and purchase flow with stepper
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Ticket, Users, CreditCard, ChevronRight, ChevronLeft, Loader2, AlertCircle, Mail, CheckCircle, Smartphone } from 'lucide-react';
import type { Event, TicketTier } from '@/types/events';
import { useTicketing } from '@/hooks/useTicketing';
import { useLanguage } from '@/hooks/useLanguage';
import { MobileMoneyService } from '@/services/mobileMoneyService';
import TicketPaymentModal from '@/components/payment/TicketPaymentModal';

interface TicketingWidgetProps {
  event: Event;
  onPurchaseComplete?: () => void;
}

type PurchaseStep = 'select' | 'details' | 'review' | 'payment' | 'processing' | 'success';

const TRANSFER_FEE_RATE = 0.05;

export const TicketingWidget: React.FC<TicketingWidgetProps> = ({
  event,
  onPurchaseComplete,
}) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('select');
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [attendeeInfo, setAttendeeInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isPurchasing, purchaseFree, purchasePaid } = useTicketing({
    eventId: event.id,
    onPurchaseSuccess: () => {
      setCurrentStep('success');
      onPurchaseComplete?.();
    },
  });

  const handleTierSelect = (tier: TicketTier) => {
    setSelectedTier(tier);
    setQuantity(1);
    setCurrentStep('details');
  };

  const validateAttendeeInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!attendeeInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!attendeeInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeInfo.email)) {
      newErrors.email = t('events.formFields.invalidEmailFormat');
    }

    // Valider le téléphone (TOUJOURS OBLIGATOIRE - Mobile Money)
    if (!attendeeInfo.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else {
      const phoneInfo = MobileMoneyService.getPhoneInfo(attendeeInfo.phone);
      if (!phoneInfo.isValid) {
        newErrors.phone = 'Numéro invalide. Utilisez Airtel (07) ou Moov (06)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 'details') {
      if (validateAttendeeInfo()) {
        setCurrentStep('review');
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('select');
    }
  };

  const handlePurchase = async () => {
    if (!selectedTier) return;

    // Pour les événements payants, passer à l'étape de paiement au lieu de traiter directement
    if (!event.is_free && selectedTier.price > 0) {
      setCurrentStep('payment');
      return;
    }

    // Pour les événements gratuits, traiter immédiatement
    setCurrentStep('processing');

    const purchaseData = {
      event_id: event.id,
      ticket_type: selectedTier.name,
      attendee_name: attendeeInfo.name,
      attendee_email: attendeeInfo.email,
      attendee_phone: attendeeInfo.phone,
      quantity,
    };

    try {
      await purchaseFree(purchaseData);
    } catch (error) {
      console.error('Purchase error:', error);
      setCurrentStep('review');
      alert('Purchase failed. Please try again.');
    }
  };

  const getTotalPrice = () => {
    if (!selectedTier) return 0;
    return selectedTier.price * quantity;
  };

  const getTransferFee = () => {
    const basePrice = getTotalPrice();
    return Math.round(basePrice * TRANSFER_FEE_RATE);
  };

  const getTotalWithFees = () => {
    return getTotalPrice() + getTransferFee();
  };

  const getAvailableQuantity = (tier: TicketTier) => {
    return tier.quantity - tier.soldCount;
  };

  const isTierSoldOut = (tier: TicketTier) => {
    return getAvailableQuantity(tier) <= 0;
  };

  const maxQuantity = selectedTier ? getAvailableQuantity(selectedTier) : 0;

  // Step progress
  const stepProgress = useMemo(() => {
    switch (currentStep) {
      case 'select': return 25;
      case 'details': return 50;
      case 'review': return 75;
      case 'payment': return 90;
      default: return 0;
    }
  }, [currentStep]);

  return (
    <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-light tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            <Ticket className="h-5 w-5 text-gray-600" />
            {event.is_free ? t('events.ticketing.reserveSpot') : t('events.ticketing.getTickets')}
          </CardTitle>
          {currentStep !== 'select' && currentStep !== 'success' && (
            <Badge variant="outline" className="rounded-lg border border-gray-200 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('events.ticketing.step')} {currentStep === 'details' ? '2' : currentStep === 'review' ? '3' : currentStep === 'payment' ? '4' : '3'} {t('events.ticketing.of')} {!event.is_free && selectedTier && selectedTier.price > 0 ? '4' : '3'}
            </Badge>
          )}
        </div>
        <CardDescription className="font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          {event.is_free
            ? t('events.ticketing.freeEventDescription')
            : t('events.ticketing.selectTicketDescription')}
        </CardDescription>

        {/* Progress bar */}
        {currentStep !== 'select' && currentStep !== 'success' && currentStep !== 'processing' && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <span>{t('events.ticketing.progress')}</span>
              <span>{stepProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stepProgress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gray-600 rounded-full"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Ticket */}
          {currentStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {event.is_free ? (
                <Card className="border border-gray-200 bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-light text-lg text-gray-900 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >{t('events.ticketing.freeEntry')}</h4>
                        <p className="text-sm text-gray-500 mt-1 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('events.ticketing.registerToAttend')}
                        </p>
                      </div>
                      <Badge className="bg-gray-900 text-white border-0 rounded-lg px-3 py-1 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('events.filters.free')}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedTier({
                          id: 'free',
                          name: t('events.ticketing.freeEntry'),
                          price: 0,
                          currency: 'EUR',
                          quantity: 999,
                          soldCount: 0,
                        });
                        setCurrentStep('details');
                      }}
                      className="w-full mt-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('events.ticketing.continue')}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {event.tickets_config.map((tier) => {
                    const available = getAvailableQuantity(tier);
                    const soldOut = isTierSoldOut(tier);
                    const isSelected = selectedTier?.id === tier.id;

                    return (
                      <motion.div
                        key={tier.id}
                        whileHover={{ scale: soldOut ? 1 : 1.02 }}
                        whileTap={{ scale: soldOut ? 1 : 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all border ${isSelected
                            ? 'border-gray-900 shadow-md bg-gray-50'
                            : soldOut
                              ? 'opacity-50 cursor-not-allowed border-gray-200'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          onClick={() => !soldOut && handleTierSelect(tier)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-light text-lg text-gray-900 tracking-tight"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                      fontWeight: 300,
                                      letterSpacing: '-0.02em',
                                    }}
                                  >{tier.name}</h4>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center"
                                    >
                                      <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                {tier.description && (
                                  <p className="text-sm text-gray-600 mb-3">
                                    {tier.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Users className="h-4 w-4" />
                                    <span>{available} {t('events.ticketing.available')}</span>
                                  </div>
                                  {tier.features && tier.features.length > 0 && (
                                    <div className="flex items-center gap-1 text-gray-600 font-light"
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span>{tier.features.length} {t('events.ticketing.features')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-light text-gray-900 tracking-tight"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                    letterSpacing: '-0.02em',
                                  }}
                                >
                                  {tier.price.toFixed(0)} FCFA
                                </div>
                                <div className="text-xs text-gray-500 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >{tier.currency}</div>
                                {soldOut && (
                                  <Badge variant="destructive" className="mt-2 rounded-lg font-light"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {t('events.ticketing.soldOut')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Attendee Details */}
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {!event.is_free && selectedTier && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-light text-gray-500"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.ticketing.selectedTicket')}</p>
                      <p className="text-lg font-light text-gray-900 tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.02em',
                        }}
                      >{selectedTier.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('events.ticketing.quantity')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          −
                        </Button>
                        <span className="w-8 text-center font-semibold">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                          disabled={quantity >= maxQuantity}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Billets</span>
                    <span className="text-base font-light text-gray-900">
                      {getTotalPrice().toFixed(0)} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >Frais de transfert (5%)</span>
                    <span className="text-base font-light text-gray-900">
                      {getTransferFee().toFixed(0)} FCFA
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.ticketing.total')}</span>
                    <span className="text-xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {getTotalWithFees().toFixed(0)} FCFA
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-light flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Users className="h-4 w-4" />
                    {t('events.formFields.fullName')} *
                  </Label>
                  <Input
                    id="name"
                    value={attendeeInfo.name}
                    onChange={(e) => {
                      setAttendeeInfo({ ...attendeeInfo, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="Jean Dupont"
                    className={`rounded-lg font-light w-full h-12 text-base transition-all duration-200 ${
                      errors.name 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                      fontSize: '16px',
                    }}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-light mt-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-light flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    {t('events.ticketing.email')} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={attendeeInfo.email}
                    onChange={(e) => {
                      setAttendeeInfo({ ...attendeeInfo, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="jean.dupont@email.com"
                    className={`rounded-lg font-light w-full h-12 text-base transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                      fontSize: '16px',
                    }}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-light mt-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-light flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Smartphone className="h-4 w-4" />
                    {t('events.ticketing.phone')} *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={attendeeInfo.phone}
                    onChange={(e) => {
                      setAttendeeInfo({ ...attendeeInfo, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="07 12 34 56 78"
                    className={`rounded-lg font-light w-full h-12 text-base transition-all duration-200 ${
                      errors.phone 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : attendeeInfo.phone && MobileMoneyService.getPhoneInfo(attendeeInfo.phone).isValid
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                        : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                      fontSize: '16px',
                    }}
                  />
                  {attendeeInfo.phone && (
                    <div className="mt-3">
                      {(() => {
                        const phoneInfo = MobileMoneyService.getPhoneInfo(attendeeInfo.phone);
                        if (phoneInfo.isValid) {
                          return (
                            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <div className="flex-1">
                                <span
                                  className="text-sm font-medium text-green-900 block"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 500,
                                  }}
                                >
                                  {phoneInfo.formatted}
                                </span>
                                <span
                                  className="text-xs text-green-700 block mt-0.5"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {phoneInfo.operatorName} • Prêt pour le paiement
                                </span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              <span
                                className="text-sm text-red-800"
                                style={{
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                  fontWeight: 300,
                                }}
                              >
                                Numéro invalide. Utilisez Airtel (07) ou Moov (06)
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                  {!attendeeInfo.phone && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      Requis pour le paiement Mobile Money
                    </p>
                  )}
                  {errors.phone && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-light mt-2"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {currentStep === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-light text-gray-900 mb-3 flex items-center gap-2 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  <Check className="h-5 w-5 text-gray-600" />
                  {t('events.ticketing.reviewOrder')}
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.ticketing.ticketType')}</span>
                    <span className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{selectedTier?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.ticketing.quantity')}</span>
                    <span className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.ticketing.attendee')}</span>
                    <span className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{attendeeInfo.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.ticketing.email')}</span>
                    <span className="font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{attendeeInfo.email}</span>
                  </div>
                  <Separator />
                  {!event.is_free && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >Billets</span>
                        <span className="font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{getTotalPrice().toFixed(0)} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >Frais de transfert (5%)</span>
                        <span className="font-light text-gray-900"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{getTransferFee().toFixed(0)} FCFA</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-lg font-light text-gray-900"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('events.ticketing.total')}</span>
                    <span className="text-2xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {event.is_free ? (
                        <Badge className="bg-gray-900 text-white border-0 rounded-lg font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >{t('events.filters.free')}</Badge>
                      ) : (
                        `${getTotalWithFees().toFixed(0)} FCFA`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 flex items-start gap-2 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {t('events.ticketing.termsAgreement')} {attendeeInfo.email}
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Processing */}
          {currentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="h-12 w-12 animate-spin text-gray-600 mb-4" />
              <p className="text-gray-600 font-light tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >{t('events.ticketing.processingOrder')}</p>
              <p className="text-sm text-gray-500 mt-2 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('events.ticketing.pleaseWait')}</p>
            </motion.div>
          )}

          {/* Payment Step - Mobile Money */}
          {currentStep === 'payment' && selectedTier && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TicketPaymentModal
                totalAmount={getTotalWithFees()}
                baseAmount={getTotalPrice()}
                transferFee={getTransferFee()}
                quantity={quantity}
                ticketName={selectedTier.name}
                customerInfo={{
                  name: attendeeInfo.name,
                  email: attendeeInfo.email,
                  phone: attendeeInfo.phone,
                }}
                onPaymentSuccess={async (paymentData) => {
                  setCurrentStep('processing');
                  
                  const purchaseData = {
                    event_id: event.id,
                    ticket_type: selectedTier.name,
                    attendee_name: attendeeInfo.name,
                    attendee_email: attendeeInfo.email,
                    attendee_phone: attendeeInfo.phone,
                    quantity,
                  };

                  try {
                    await purchasePaid(purchaseData, getTotalWithFees(), selectedTier.currency);
                  } catch (error) {
                    console.error('Ticket purchase error:', error);
                    setCurrentStep('payment');
                  }
                }}
                onPaymentError={(error) => {
                  console.error('Payment error:', error);
                  setCurrentStep('review');
                }}
                onCancel={() => {
                  setCurrentStep('review');
                }}
              />
            </motion.div>
          )}

          {/* Success - Premium Design */}
          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              {/* Minimal Checkmark - Apple Style */}
              <motion.div
                className="relative mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                }}
              >
                <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, pathLength: 0 }}
                    animate={{ scale: 1, pathLength: 1 }}
                    transition={{
                      delay: 0.3,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Check className="w-8 h-8 text-white" strokeWidth={3} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Success Message - Minimal Typography */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-3 mb-8"
              >
                <h3 className="text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t('events.ticketing.ticketReserved')}
                </h3>

                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('events.ticketing.spotConfirmed')}
                </p>
              </motion.div>

              {/* Email Confirmation - Minimal */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{t('events.ticketing.sentTo')}</span>
                  <span className="text-gray-900 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{attendeeInfo.email}</span>
                </div>
              </motion.div>

              {/* Ticket Type - Minimal Badge */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <Badge
                  variant="outline"
                  className="rounded-full px-4 py-1.5 text-xs font-light border border-gray-200 text-gray-600 bg-transparent"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Ticket className="h-3 w-3 mr-1.5" />
                  {selectedTier?.name || t('events.ticketing.freeEntry')}
                </Badge>
              </motion.div>

              {/* Action Button - Minimal */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full space-y-2"
              >
                <Button
                  onClick={() => {
                    setCurrentStep('select');
                    setSelectedTier(null);
                    setQuantity(1);
                    setAttendeeInfo({ name: '', email: '', phone: '' });
                  }}
                  variant="outline"
                  className="w-full rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-900 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t('events.ticketing.reserveAnotherTicket')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {/* Footer Actions */}
      {currentStep !== 'processing' && currentStep !== 'success' && currentStep !== 'payment' && (
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200/50">
          {currentStep !== 'select' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="rounded-xl w-full sm:w-auto sm:min-w-[120px]"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          )}

          {currentStep === 'select' && selectedTier && (
            <Button
              onClick={() => setCurrentStep('details')}
              className="rounded-lg w-full sm:flex-1 bg-gray-900 hover:bg-gray-800 text-white font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('events.ticketing.continue')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentStep === 'details' && (
            <Button
              onClick={handleNext}
              disabled={!attendeeInfo.name || !attendeeInfo.email || !attendeeInfo.phone || (attendeeInfo.phone && !MobileMoneyService.getPhoneInfo(attendeeInfo.phone).isValid)}
              className="rounded-lg w-full sm:flex-1 bg-gray-900 hover:bg-gray-800 text-white font-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('events.ticketing.reviewOrder')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {currentStep === 'review' && (
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="rounded-lg w-full sm:flex-1 bg-gray-900 hover:bg-gray-800 text-white font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
              }}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('events.ticketing.processing')}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {event.is_free ? t('events.formFields.confirmReservation') : t('events.ticketing.completePurchase')}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
