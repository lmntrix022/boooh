/**
 * Système de tracking de complétion des services Opéré (Admin)
 * Permet aux admins de suivre la progression des services livrés aux clients Opéré
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  Package,
  MessageSquare,
  TrendingUp,
  Calendar,
  DollarSign,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useOpereSetupAdmin } from '@/hooks/useOpereSetup';
import { OpereSetupPayment } from '@/hooks/useOpereSetup';

interface ServiceTrackerProps {
  paymentId?: string; // Si fourni, affiche un seul paiement
}

export function OpereServiceTracker({ paymentId }: ServiceTrackerProps) {
  const { allPayments, loading, confirmPayment, updateProgress, refundPayment } = useOpereSetupAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    completion: number;
    services: string[];
    notes: string;
  }>({
    completion: 0,
    services: [],
    notes: '',
  });
  
  // Filtrer les paiements
  const payments = useMemo(() => {
    if (paymentId) {
      return allPayments.filter(p => p.id === paymentId);
    }
    return allPayments.filter(p => p.payment_status === 'paid');
  }, [allPayments, paymentId]);
  
  // Statistiques
  const stats = useMemo(() => {
    const total = payments.length;
    const inProgress = payments.filter(p => p.completion_percentage > 0 && p.completion_percentage < 100).length;
    const completed = payments.filter(p => p.completion_percentage === 100).length;
    const avgCompletion = payments.length > 0
      ? Math.round(payments.reduce((sum, p) => sum + p.completion_percentage, 0) / payments.length)
      : 0;
    
    return { total, inProgress, completed, avgCompletion };
  }, [payments]);
  
  // Démarrer l'édition
  const handleStartEdit = (payment: OpereSetupPayment) => {
    setEditingId(payment.id);
    setEditData({
      completion: payment.completion_percentage,
      services: payment.services_delivered || [],
      notes: payment.admin_notes || '',
    });
  };
  
  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ completion: 0, services: [], notes: '' });
  };
  
  // Sauvegarder
  const handleSave = async (paymentId: string) => {
    const success = await updateProgress(
      paymentId,
      editData.completion,
      editData.services,
      editData.notes
    );
    
    if (success) {
      setEditingId(null);
      setEditData({ completion: 0, services: [], notes: '' });
    } else {
      alert('Erreur lors de la sauvegarde');
    }
  };
  
  // Toggle service
  const toggleService = (service: string) => {
    if (editData.services.includes(service)) {
      setEditData({
        ...editData,
        services: editData.services.filter(s => s !== service),
      });
    } else {
      setEditData({
        ...editData,
        services: [...editData.services, service],
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {!paymentId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Total</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">En cours</span>
            </div>
            <div className="text-3xl font-bold text-amber-900">{stats.inProgress}</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Complétés</span>
            </div>
            <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Progression Moy.</span>
            </div>
            <div className="text-3xl font-bold text-purple-900">{stats.avgCompletion}%</div>
          </div>
        </div>
      )}
      
      {/* Liste des paiements */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun paiement Opéré à suivre
          </div>
        ) : (
          payments.map((payment) => {
            const isEditing = editingId === payment.id;
            const packageData = payment.package_id; // Récupérer les détails du package si nécessaire
            
            return (
              <motion.div
                key={payment.id}
                layout
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
              >
                {/* En-tête */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold
                        ${payment.completion_percentage === 100 
                          ? 'bg-green-600 text-white' 
                          : payment.completion_percentage > 0
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                        }
                      `}>
                        {payment.completion_percentage}%
                      </div>
                      
                      <div>
                        <div className="font-bold text-gray-900">
                          Package {payment.package_id.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            User ID: {payment.user_id.slice(0, 8)}...
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {payment.amount_paid_fcfa.toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(payment)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Contenu */}
                <div className="p-6 space-y-6">
                  {/* Barre de progression */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Progression globale</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.completion}
                          onChange={(e) => setEditData({ ...editData, completion: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-900">{payment.completion_percentage}%</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          (isEditing ? editData.completion : payment.completion_percentage) === 100
                            ? 'bg-green-600'
                            : (isEditing ? editData.completion : payment.completion_percentage) > 0
                            ? 'bg-amber-600'
                            : 'bg-gray-400'
                        }`}
                        style={{
                          width: `${isEditing ? editData.completion : payment.completion_percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Services livrés */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Services livrés</h3>
                    <div className="space-y-2">
                      {/* Liste des services du package */}
                      {['Configuration compte', 'Formation équipe', 'Setup Analytics', 'Stratégie digitale', 'Support prioritaire'].map((service) => {
                        const isDelivered = isEditing 
                          ? editData.services.includes(service)
                          : (payment.services_delivered || []).includes(service);
                        
                        return (
                          <div
                            key={service}
                            onClick={() => isEditing && toggleService(service)}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                              ${isEditing ? 'cursor-pointer hover:bg-gray-50' : ''}
                              ${isDelivered 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-gray-200 bg-white'
                              }
                            `}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${isDelivered ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                              {service}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Notes admin */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Notes internes
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        rows={3}
                        placeholder="Notes pour l'équipe..."
                      />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {payment.admin_notes || 'Aucune note'}
                      </div>
                    )}
                  </div>
                  
                  {/* Feedback client */}
                  {payment.client_feedback && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Feedback client</h3>
                      <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700 border-2 border-blue-200">
                        "{payment.client_feedback}"
                      </div>
                    </div>
                  )}
                  
                  {/* Dates */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Paiement</div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Début livraison</div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.delivery_started_at ? new Date(payment.delivery_started_at).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Complétion</div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.delivery_completed_at ? new Date(payment.delivery_completed_at).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleSave(payment.id)}
                        className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
