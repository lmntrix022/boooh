/**
 * Utilitaire pour tester l'authentification et la création de contacts
 */

import { supabase } from '@/integrations/supabase/client';
import { ContactAutoCreation } from '@/services/contactAutoCreation';

export const testContactCreation = async () => {
  try {
    // Log removed
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      // Error log removed
      return false;
    }
    
    if (!user) {
      // Error log removed
      return false;
    }
    
    // Log removed
    
    // Test de création de contact depuis un RDV
    await ContactAutoCreation.createContactFromAppointment('test-card-id', {
      client_name: 'Test User',
      client_email: 'test@example.com',
      client_phone: '0123456789',
      notes: 'Test de création automatique',
      date: new Date().toISOString(),
      card_id: 'test-card-id'
    });
    
    // Log removed
    return true;
    
  } catch (error) {
    // Error log removed
    return false;
  }
};

// Exporter pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).testContactCreation = testContactCreation;
  // Log removed
}
