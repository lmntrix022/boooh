import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Send, Mail, Phone, Calendar, MessageSquare, 
  Loader2, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

interface ContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  type: 'note' | 'email' | 'call' | 'meeting' | 'whatsapp' | 'sms';
  subject?: string;
  content: string;
  metadata?: any;
  created_at: string;
}

interface ContactNotesProps {
  contactId: string;
  contactEmail: string;
}

export const ContactNotes: React.FC<ContactNotesProps> = ({ contactId, contactEmail }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [contactId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      // Note: Cette table doit être créée (voir migration SQL dans guide)
      const { data, error } = await supabase
        .from('contact_interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) {
        // Si table n'existe pas encore, utiliser un fallback
        console.warn('Table contact_interactions not found. Using empty state.');
        setNotes([]);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: t('contactNotes.toasts.emptyNote.title'),
        description: t('contactNotes.toasts.emptyNote.description'),
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('contact_interactions')
        .insert({
          contact_id: contactId,
          user_id: user?.id,
          type: 'note',
          content: newNote
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote('');
      
      toast({
        title: t('contactNotes.toasts.noteAdded.title'),
        description: t('contactNotes.toasts.noteAdded.description')
      });
    } catch (error) {
      toast({
        title: t('contactNotes.toasts.error.title'),
        description: t('contactNotes.toasts.error.description'),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };


  return (
    <Card className="w-full mt-6 bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-light tracking-tight"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontWeight: 300,
            letterSpacing: '-0.02em',
          }}
        >
          <FileText className="w-5 h-5 text-gray-600" />
          {t('contactNotes.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ajouter nouvelle note */}
        <div className="space-y-2">
          <Textarea 
            value={newNote} 
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={t('contactNotes.placeholder')}
            rows={3}
            className="w-full border border-gray-200 rounded-lg font-light"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          />
          <Button 
            onClick={addNote} 
            disabled={saving}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light rounded-lg"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('contactNotes.saving')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('contactNotes.addNote')}
              </>
            )}
          </Button>
        </div>

        {/* Liste des notes */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contactNotes.loading')}</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400" />
              <p className="font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('contactNotes.empty')}</p>
              
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gray-100 border border-gray-200`}>
                      <div className="text-gray-600">
                        {getIconByType(note.type)}
                      </div>
                    </div>
                    <div>
                      {note.subject && (
                        <p className="font-light text-gray-900 tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.01em',
                          }}
                        >{note.subject}</p>
                      )}
                      <Badge variant="secondary" className="text-xs font-light bg-gray-100 text-gray-600 border border-gray-200"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {note.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    {note.created_at && !isNaN(new Date(note.created_at).getTime())
                      ? format(new Date(note.created_at), 'PPp', { locale: currentLanguage === 'fr' ? fr : enUS })
                      : t('crmDetail.timeline.noDate') || 'Date inconnue'}
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{note.content}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

