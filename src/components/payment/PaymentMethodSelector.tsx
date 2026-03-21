import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type PaymentMethod = 'mobile_money' | 'stripe' | 'cash_on_delivery';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  totalAmount: number;
  disabled?: boolean;
  allowCashOnDelivery?: boolean; // Nouveau prop pour permettre/désactiver le paiement à la livraison
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodSelect,
  totalAmount,
  disabled = false,
  allowCashOnDelivery = true,
}) => {
  const paymentMethods = [
    {
      id: 'mobile_money' as PaymentMethod,
      name: 'Mobile Money',
      description: 'Paiement instantané via USSD Push (Airtel, Moov)',
      icon: Smartphone,
      badge: 'Recommandé',
      badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
      gradient: 'from-green-50 via-emerald-50/50 to-green-50',
      borderColor: 'border-green-300',
      selectedBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      available: true, // Toujours disponible
    },
    {
      id: 'stripe' as PaymentMethod,
      name: 'Carte Bancaire',
      description: 'Paiement sécurisé par Stripe (Visa, Mastercard)',
      icon: CreditCard,
      badge: 'Disponible',
      badgeColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      gradient: 'from-blue-50 via-indigo-50/50 to-blue-50',
      borderColor: 'border-blue-300',
      selectedBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      available: true, // Toujours disponible
    },
    {
      id: 'cash_on_delivery' as PaymentMethod,
      name: 'Paiement à la Livraison',
      description: 'Payez en espèces à la réception du produit',
      icon: Wallet,
      badge: 'Produits physiques uniquement',
      badgeColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
      gradient: 'from-orange-50 via-amber-50/50 to-orange-50',
      borderColor: 'border-orange-300',
      selectedBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      available: allowCashOnDelivery, // Disponible seulement si allowCashOnDelivery est true
    },
  ];

  // Filtrer les méthodes non disponibles (ex: cash_on_delivery pour produits digitaux)
  const availableMethods = paymentMethods.filter(method => method.available);

  return (
    <div className="space-y-6">
      {/* Header avec montant */}
      <div className="text-center">
        <div className="inline-block p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl border border-gray-200 mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Choisissez votre méthode de paiement
          </h3>
          
        </div>
      </div>

      <div className="grid gap-4">
        {availableMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isDisabled = disabled || !method.available;

          return (
            <Card
              key={method.id}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                isSelected
                  ? `ring-2 ring-offset-2 ${method.borderColor} shadow-lg scale-[1.02]`
                  : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg hover:scale-[1.01] border-gray-200'
              }`}
              onClick={() => !isDisabled && onMethodSelect(method.id)}
            >
              {/* Background gradient décoratif */}
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-60`}></div>
              )}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${method.gradient} opacity-10 rounded-full -mr-12 -mt-12`}></div>
              
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icône avec gradient */}
                    <div className={`p-3.5 rounded-xl shadow-md ${
                      isSelected 
                        ? `${method.iconBg} text-white` 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                    } transition-all duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2.5 mb-1.5">
                        <h4 className={`text-base font-semibold ${
                          isSelected 
                            ? 'text-gray-900' 
                            : 'text-gray-900'
                        }`}>
                          {method.name}
                        </h4>
                        <Badge className={`text-xs px-2.5 py-0.5 ${method.badgeColor} text-white shadow-sm`}>
                          {method.badge}
                        </Badge>
                      </div>
                      <p className={`text-sm ${
                        isSelected ? 'text-gray-700' : 'text-gray-600'
                      } leading-relaxed`}>
                        {method.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur de sélection */}
                  {isSelected && (
                    <div className="flex items-center ml-4">
                      <div className={`p-2 ${method.iconBg} rounded-full shadow-lg`}>
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Indicateur hover pour les méthodes non sélectionnées */}
                  {!isSelected && !isDisabled && (
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedMethod === 'mobile_money' && (
        <div className="relative overflow-hidden mt-6 p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-2xl border-2 border-green-200 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start space-x-4">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Paiement Mobile Money</h4>
              <p className="text-sm text-green-800 leading-relaxed">
                Vous recevrez un code USSD sur votre téléphone pour confirmer le paiement instantanément.
                Compatible avec <span className="font-semibold">Airtel Money (07)</span> et <span className="font-semibold">Moov Money (06)</span> du Gabon.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedMethod === 'stripe' && (
        <div className="relative overflow-hidden mt-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border-2 border-blue-200 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start space-x-4">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Paiement par Carte Bancaire</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Paiement sécurisé via Stripe. Vous serez redirigé vers une page sécurisée pour saisir vos informations de carte.
                Accepte <span className="font-semibold">Visa</span>, <span className="font-semibold">Mastercard</span> et autres cartes internationales.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedMethod === 'cash_on_delivery' && (
        <div className="relative overflow-hidden mt-6 p-5 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 rounded-2xl border-2 border-orange-200 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start space-x-4">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">Paiement à la Livraison</h4>
              <p className="text-sm text-orange-800 leading-relaxed">
                Payez en espèces directement au livreur. Des frais de livraison peuvent s'appliquer.
                Disponible uniquement pour les <span className="font-semibold">produits physiques</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;


















