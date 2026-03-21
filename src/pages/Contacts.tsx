import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { downloadFileWithCleanup, cleanupOrphanedBlobs } from '@/utils/blobCleanup';
import '@/utils/forceBlobCleanup'; // Import pour rendre la fonction disponible
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
// Textarea déjà importé plus bas via "@/components/ui/textarea"
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Globe,
  Users,
  Camera,
  FileText,
  Tag,
  MoreVertical,
  CheckCircle,
  Grid3X3,
  List,
  CheckSquare,
  Square,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Zap,
  Target,
  User,
  LayoutGrid,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScannedContactsService, ScannedContact } from '@/services/scannedContactsService';
import CardScanner from '@/components/contacts/CardScanner';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

// Composant pour une carte de contact draggable
interface DraggableContactCardProps {
  contact: ScannedContact;
  index: number;
  onViewContact: (contact: ScannedContact) => void;
  onEditContact: (contact: ScannedContact) => void;
  onDeleteContact: (id: string) => void;
  getInitials: (name: string) => string;
  getConfidenceColor: (confidence: number) => string;
  t: (key: string) => string;
  format: typeof format;
  currentLanguage: string;
  fr: typeof fr;
  enUS: typeof enUS;
  navigate: ReturnType<typeof useNavigate>;
}

const DraggableContactCard: React.FC<DraggableContactCardProps> = ({
  contact,
  index,
  onViewContact,
  onEditContact,
  onDeleteContact,
  getInitials,
  getConfidenceColor,
  t,
  format,
  currentLanguage,
  fr,
  enUS,
  navigate,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id || `contact-${index}`,
    data: { contact },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative z-10 p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10 border border-gray-200 flex-shrink-0">
              <AvatarImage src={contact.scan_source_image_url} />
              <AvatarFallback className="bg-gray-100 text-gray-900 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {getInitials(contact.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-light text-gray-900 text-sm truncate tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >
                {contact.full_name || t('contacts.contactDetails.unknownName')}
              </h4>
              <p className="text-xs text-gray-500 truncate font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                {contact.title} {contact.company && `• ${contact.company}`}
              </p>
            </div>
          </div>
          
          {(contact.email || contact.phone) && (
            <div className="space-y-1.5 mb-3">
              {contact.email && (
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600 truncate font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{contact.phone}</span>
                </div>
              )}
            </div>
          )}

          {contact.scan_confidence && (
            <Badge
              variant="secondary"
              className={cn("text-xs font-light mb-2", getConfidenceColor(contact.scan_confidence))}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {Math.round(contact.scan_confidence * 100)}%
            </Badge>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
            <span className="text-xs text-gray-500">
              {contact.created_at && format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS })}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}/crm`)}>
                  <Zap className="w-4 h-4 mr-2" />
                  {t('contacts.actions.viewCRM')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewContact(contact)}>
                  <Eye className="w-4 h-4 mr-2" />
                  {t('contacts.actions.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditContact(contact)}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('contacts.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => contact.id && onDeleteContact(contact.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('contacts.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Composant pour une colonne Kanban
interface KanbanColumnProps {
  id: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  contacts: ScannedContact[];
  onViewContact: (contact: ScannedContact) => void;
  onEditContact: (contact: ScannedContact) => void;
  onDeleteContact: (id: string) => void;
  getInitials: (name: string) => string;
  getConfidenceColor: (confidence: number) => string;
  t: (key: string) => string;
  format: typeof format;
  currentLanguage: string;
  fr: typeof fr;
  enUS: typeof enUS;
  navigate: ReturnType<typeof useNavigate>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  label,
  icon: Icon,
  gradient,
  contacts,
  onViewContact,
  onEditContact,
  onDeleteContact,
  getInitials,
  getConfidenceColor,
  t,
  format,
  currentLanguage,
  fr,
  enUS,
  navigate,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <motion.div className="flex flex-col h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div
        ref={setNodeRef}
        className={`relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col ${
          isOver ? 'ring-2 ring-gray-300 bg-gray-50' : ''
        }`}
      >
        {/* Header de colonne */}
        <div className="relative z-10 p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-light text-gray-900 text-sm tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >{label}</h3>
              <p className="text-xs text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{contacts.length} {contacts.length === 1 ? 'élément' : 'éléments'}</p>
            </div>
          </div>
        </div>

        {/* Zone droppable */}
        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
          <AnimatePresence>
            {contacts.map((contact, index) => (
              <DraggableContactCard
                key={contact.id || `contact-${index}`}
                contact={contact}
                index={index}
                onViewContact={onViewContact}
                onEditContact={onEditContact}
                onDeleteContact={onDeleteContact}
                getInitials={getInitials}
                getConfidenceColor={getConfidenceColor}
                t={t}
                format={format}
                currentLanguage={currentLanguage}
                fr={fr}
                enUS={enUS}
                navigate={navigate}
              />
            ))}
          </AnimatePresence>
          {contacts.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t('contacts.emptyState.noContacts') || 'Aucun contact'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Contacts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();

  // Utility to strip emojis from labels (for cleaner selects)
  const cleanLabel = React.useCallback((label?: string) => {
    if (!label) return '';
    return label
      .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }, []);
  
  const [contacts, setContacts] = useState<ScannedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showScanner, setShowScanner] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ScannedContact | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [contactToView, setContactToView] = useState<ScannedContact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<ScannedContact | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    notes: ''
  });

  // Sensors pour drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Colonnes Kanban basées sur les étapes CRM
  const kanbanColumns = useMemo(() => [
    {
      id: 'lead',
      label: t('contacts.kanban.lead') || 'Lead',
      icon: Target,
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      filter: (c: ScannedContact) =>
        !c.source_type ||
        ['lead', 'scanner'].includes((c.source_type as any)),
    },
    {
      id: 'prospect',
      label: t('contacts.kanban.prospect') || 'Prospect',
      icon: Zap,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      filter: (c: ScannedContact) =>
        ['prospect', 'manual'].includes((c.source_type as any)),
    },
    {
      id: 'customer',
      label: t('contacts.kanban.customer') || 'Client',
      icon: CheckCircle,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      filter: (c: ScannedContact) =>
        ['customer', 'order', 'digital_order', 'appointment'].includes((c.source_type as any)),
    },
    {
      id: 'inactive',
      label: t('contacts.kanban.inactive') || 'Inactif',
      icon: AlertCircle,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      filter: (c: ScannedContact) =>
        ['inactive', 'archived'].includes((c.source_type as any)),
    },
  ], [t]);

  // Gérer le drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  // Gérer le drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.id) return;

    const contactId = active.id as string;
    const targetColumnId = over.id as string;

    // Trouver le contact
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Déterminer le nouveau statut CRM selon la colonne cible
    let newSourceType: string | null = null;
    if (targetColumnId === 'lead') {
      newSourceType = 'lead';
    } else if (targetColumnId === 'prospect') {
      newSourceType = 'prospect';
    } else if (targetColumnId === 'customer') {
      newSourceType = 'customer';
    } else if (targetColumnId === 'inactive') {
      newSourceType = 'inactive';
    }

    // Mettre à jour le contact
    if (newSourceType !== null && contact.id) {
      try {
        await ScannedContactsService.updateContact(
          contact.id,
          {
            ...(contact as any),
            source_type: newSourceType as any,
          } as any
        );
        await loadContacts();
        toast({
          title: t('contacts.toasts.contactUpdated.title'),
          description: t('contacts.toasts.contactUpdated.description'),
        });
      } catch (error) {
        toast({
          title: t('contacts.toasts.updateError.title'),
          description: t('contacts.toasts.updateError.description'),
          variant: "destructive",
        });
      }
    }
  };

  // Charger les contacts
  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  // Nettoyer les URLs blob orphelines au montage
  useEffect(() => {
    cleanupOrphanedBlobs();
    
    // Nettoyage plus agressif des blob URLs
    const cleanupBlobs = () => {
      // Récupérer tous les blob URLs actifs
      const activeBlobs = new Set<string>();
      
      // Parcourir tous les éléments du DOM pour trouver les blob URLs
      const elements = document.querySelectorAll('img, video, audio, source');
      elements.forEach(element => {
        const src = element.getAttribute('src');
        if (src && src.startsWith('blob:')) {
          activeBlobs.add(src);
        }
      });
      
      // Nettoyer les blob URLs qui ne sont plus utilisés
      if (typeof window !== 'undefined' && window.URL) {
        // Cette approche est limitée car on ne peut pas lister tous les blob URLs
        // Mais on peut forcer le garbage collection
        if (window.gc) {
          window.gc();
        }
      }
    };
    
    // Nettoyage immédiat
    cleanupBlobs();
    
    // Nettoyage périodique
    const interval = setInterval(cleanupBlobs, 30000); // Toutes les 30 secondes
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await ScannedContactsService.getUserContacts(user!.id);
      setContacts(data);
    } catch (error) {
      // Error log removed
      toast({
        title: t('contacts.toasts.errorLoading.title'),
        description: t('contacts.toasts.errorLoading.description'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchQuery || 
        contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery);
      
      const matchesSource = filterSource === 'all' || contact.source_type === filterSource;
      
      // Pour le filtre de statut, on utilise la confiance de scan
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        if (filterStatus === 'high_confidence') {
          matchesStatus = contact.scan_confidence ? contact.scan_confidence >= 0.8 : false;
        } else if (filterStatus === 'medium_confidence') {
          matchesStatus = contact.scan_confidence ? contact.scan_confidence >= 0.6 && contact.scan_confidence < 0.8 : false;
        } else if (filterStatus === 'low_confidence') {
          matchesStatus = contact.scan_confidence ? contact.scan_confidence < 0.6 : false;
        }
      }
      
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [contacts, searchQuery, filterSource, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredContacts.length);
  
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, startIndex, endIndex]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetCreateForm = () => {
    setCreateForm({
      full_name: '',
      first_name: '',
      last_name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      notes: '',
    });
  };

  const handleCreateContact = async () => {
    if (!user) return;

    if (!createForm.full_name && !createForm.email && !createForm.phone) {
      toast({
        title: t('contacts.toasts.manualCreateMissingFields.title') || 'Champs obligatoires manquants',
        description: t('contacts.toasts.manualCreateMissingFields.description') || 'Renseignez au moins un nom, un email ou un téléphone.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<ScannedContact> = {
        user_id: user.id,
        full_name: createForm.full_name || `${createForm.first_name} ${createForm.last_name}`.trim(),
        first_name: createForm.first_name || null,
        last_name: createForm.last_name || null,
        company: createForm.company || null,
        title: createForm.title || null,
        email: createForm.email || null,
        phone: createForm.phone || null,
        address: createForm.address || null,
        website: createForm.website || null,
        notes: createForm.notes || null,
        source_type: 'manual' as any,
        scan_confidence: 1,
      };

      await ScannedContactsService.createManualContact(payload as any);
      await loadContacts();

      toast({
        title: t('contacts.toasts.contactCreated.title') || 'Contact créé',
        description: t('contacts.toasts.contactCreated.description') || 'Le contact a été ajouté à votre CRM.',
      });

      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (error) {
      toast({
        title: t('contacts.toasts.createError.title') || 'Erreur lors de la création',
        description: t('contacts.toasts.createError.description') || 'Impossible de créer ce contact. Réessayez.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Grouper les contacts par colonne Kanban
  const contactsByColumn = useMemo(() => {
    const grouped: Record<string, ScannedContact[]> = {};
    kanbanColumns.forEach(col => {
      grouped[col.id] = filteredContacts.filter(col.filter);
    });
    return grouped;
  }, [filteredContacts, kanbanColumns]);

  // Statistiques
  const stats = useMemo(() => {
    const total = contacts.length;
    const scanned = contacts.filter(c => c.source_type === 'scanner').length;
    const manual = contacts.filter(c => c.source_type === 'manual').length;
    const fromOrders = contacts.filter(c => c.source_type === 'order').length;
    const fromAppointments = contacts.filter(c => c.source_type === 'appointment').length;
    const fromDigitalOrders = contacts.filter(c => c.source_type === 'digital_order').length;
    const highConfidence = contacts.filter(c => (c.scan_confidence || 0) > 0.8).length;
    const recentContacts = contacts.filter(c => {
      if (!c.created_at) return false;
      const daysSinceCreation = (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 30;
    }).length;
    
    return { total, scanned, manual, fromOrders, fromAppointments, fromDigitalOrders, highConfidence, recentContacts };
  }, [contacts]);

  // Gérer la création d'un nouveau contact
  const handleContactCreated = (newContact: ScannedContact) => {
    setContacts(prev => [newContact, ...prev]);
    setShowScanner(false);
    toast({
      title: t('contacts.toasts.contactAdded.title'),
      description: t('contacts.toasts.contactAdded.description'),
    });
  };

  // Gérer la sélection multiple
  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id).filter((id): id is string => !!id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedContacts(new Set());
  };

  // Export sélectif
  const handleExportSelectedCSV = async () => {
    if (selectedContacts.size === 0) {
      toast({
        title: t('contacts.toasts.noSelection.title'),
        description: t('contacts.toasts.noSelection.description'),
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const selectedContactsData = contacts.filter(c => c.id && selectedContacts.has(c.id));
      const csvData = ScannedContactsService.exportContactsCSV(selectedContactsData);
      
      downloadFileWithCleanup(
        csvData,
        `contacts_selection_${format(new Date(), 'yyyy-MM-dd')}.csv`,
        'text/csv;charset=utf-8;'
      );
      
      toast({
        title: t('contacts.toasts.exportCSVSuccess.title'),
        description: t('contacts.toasts.exportCSVSuccess.description', { count: selectedContacts.size }),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('contacts.toasts.exportCSVError.title'),
        description: t('contacts.toasts.exportCSVError.description'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelectedVCard = async () => {
    if (selectedContacts.size === 0) {
      toast({
        title: t('contacts.toasts.noSelection.title'),
        description: t('contacts.toasts.noSelection.description'),
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const selectedContactsData = contacts.filter(c => c.id && selectedContacts.has(c.id));
      const vcardData = ScannedContactsService.exportContactsVCardFromArray(selectedContactsData);
      
      downloadFileWithCleanup(
        vcardData,
        `contacts_selection_${format(new Date(), 'yyyy-MM-dd')}.vcf`,
        'text/vcard;charset=utf-8;'
      );
      
      toast({
        title: t('contacts.toasts.exportVCardSuccess.title'),
        description: t('contacts.toasts.exportVCardSuccess.description', { count: selectedContacts.size }),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('contacts.toasts.exportVCardError.title'),
        description: t('contacts.toasts.exportVCardError.description'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Ouvrir la confirmation de suppression
  const handleDeleteContact = (contactId: string) => {
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      await ScannedContactsService.deleteContact(contactToDelete);
      setContacts(prev => prev.filter(c => c.id !== contactToDelete));
      toast({
        title: t('contacts.toasts.contactDeleted.title'),
        description: t('contacts.toasts.contactDeleted.description'),
      });
    } catch (error) {
      // Error log removed
      toast({
        title: t('contacts.toasts.deleteError.title'),
        description: t('contacts.toasts.deleteError.description'),
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  // Voir un contact
  const handleViewContact = (contact: ScannedContact) => {
    setContactToView(contact);
    setViewDialogOpen(true);
  };

  // Modifier un contact
  const handleEditContact = (contact: ScannedContact) => {
    setContactToEdit(contact);
    setEditForm({
      full_name: contact.full_name || '',
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      title: contact.title || '',
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      website: contact.website || '',
      notes: contact.notes || ''
    });
    setEditDialogOpen(true);
  };

  // Gérer les changements du formulaire
  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!editForm.full_name.trim()) {
      toast({
        title: t('contacts.toasts.validationError.title'),
        description: t('contacts.toasts.validationError.fullNameRequired'),
        variant: "destructive",
      });
      return false;
    }
    
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      toast({
        title: t('contacts.toasts.validationError.title'),
        description: t('contacts.toasts.validationError.invalidEmail'),
        variant: "destructive",
      });
      return false;
    }

    if (editForm.website && !/^https?:\/\/.+/.test(editForm.website)) {
      toast({
        title: t('contacts.toasts.validationError.title'),
        description: t('contacts.toasts.validationError.invalidWebsite'),
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Sauvegarder les modifications
  const handleSaveContact = async () => {
    if (!contactToEdit?.id || !validateForm()) return;

    setIsSaving(true);
    try {
      const updatedContact = await ScannedContactsService.updateContact(contactToEdit.id, editForm);
      
      // Mettre à jour la liste des contacts
      setContacts(prev => prev.map(contact => 
        contact.id === contactToEdit.id ? { ...contact, ...editForm } : contact
      ));

      toast({
        title: t('contacts.toasts.contactUpdated.title'),
        description: t('contacts.toasts.contactUpdated.description'),
      });

      setEditDialogOpen(false);
      setContactToEdit(null);
    } catch (error) {
      // Error log removed
      toast({
        title: t('contacts.toasts.updateError.title'),
        description: t('contacts.toasts.updateError.description'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };



  // Obtenir les initiales
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Obtenir la couleur de confiance
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="relative z-10 container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 md:p-8 lg:p-10">
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
                  {/* Left: Icon + Title */}
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-6 min-w-0 flex-1">
                    {/* Icon Container */}
                    <motion.div
                      className="relative group flex-shrink-0"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-600 relative z-10" />
                      </div>
                    </motion.div>
                    
                    {/* Title Section */}
                    <div className="flex-1 pt-1 min-w-0">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="min-w-0"
                      >
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-2 sm:mb-3 leading-tight break-words"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                              {t('contacts.title')}
                        </h1>
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          className="text-gray-500 text-base md:text-lg font-light mt-2"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {t('contacts.subtitle')}
                        </motion.p>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Right: Stats Badge */}
                  {contacts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="hidden lg:flex items-center"
                    >
                      <div className="relative px-6 py-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="relative flex items-center gap-3">
                          <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xl font-light text-gray-900 leading-none tracking-tight"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 300,
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {contacts.length}
                            </span>
                            <span className="text-xs font-light text-gray-500 tracking-wider"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('contacts.stats.total')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Barre d'actions */}
          <motion.div
            className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
              {/* Mobile: Une ligne compacte */}
            <div className="flex flex-row items-center gap-2 md:hidden">
              {/* Bouton scan avec icône uniquement - même taille que les toggles */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setShowScanner(true)}
                  size="icon"
                  className="w-10 h-10 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </motion.div>

                {/* Bouton ajout manuel */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    size="icon"
                    className="w-10 h-10 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-lg shadow-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </motion.div>
              
              {/* Toggle vues */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg border border-gray-200 p-1">
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md w-10 h-10 flex items-center justify-center transition-all font-light ${
                    viewMode === 'grid'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Grid3X3 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`rounded-md w-10 h-10 flex items-center justify-center transition-all font-light ${
                    viewMode === 'list'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <List className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('kanban')}
                  className={`rounded-md w-10 h-10 flex items-center justify-center transition-all font-light ${
                    viewMode === 'kanban'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LayoutGrid className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            
              {/* Desktop: Actions centrées + secondaires */}
            <div className="hidden md:flex flex-col xl:flex-row items-center justify-center xl:justify-between gap-6">
              {/* Actions principales (centrées) */}
              <div className="flex items-center justify-center gap-4">
                {/* Bouton scan */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setShowScanner(true)}
                    className="w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                </motion.div>

                {/* Bouton ajout manuel */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="h-12 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-lg shadow-sm font-light flex items-center gap-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, \"SF Pro Text\", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden lg:inline">
                      {t('contacts.actions.createManual', 'Ajouter un contact')}
                    </span>
                  </Button>
                </motion.div>
                
                {/* Toggle vues */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg border border-gray-200 p-1">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md px-4 py-2.5 transition-all font-light ${
                      viewMode === 'grid'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md px-4 py-2.5 transition-all font-light ${
                      viewMode === 'list'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <List className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('kanban')}
                    className={`rounded-md px-4 py-2.5 transition-all font-light ${
                      viewMode === 'kanban'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              
              {/* Actions secondaires (droite) */}
              {selectedContacts.size > 0 && (
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={handleExportSelectedCSV}
                    disabled={isExporting}
                    variant="outline"
                    className="rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('contacts.selection.exportCSV', { count: selectedContacts.size })}
                  </Button>
                  <Button
                    onClick={handleExportSelectedVCard}
                    disabled={isExporting}
                    variant="outline"
                    className="rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('contacts.selection.exportVCard', { count: selectedContacts.size })}
                  </Button>
                  <Button
                    onClick={handleClearSelection}
                    variant="outline"
                    className="rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {t('contacts.selection.clearSelection')}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Total */}
            <motion.div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10 p-5 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-light text-gray-500 tracking-wider mb-2"
                style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('contacts.stats.total')}
                    </p>
                    <p className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stats.total}
                    </p>
                  </div>
                  
                  {/* Icon Container */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Users className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Scanned */}
            <motion.div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10 p-5 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-light text-gray-500 tracking-wider mb-2"
                style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('contacts.stats.scanned')}
                    </p>
                    <p className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stats.scanned}
                    </p>
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Camera className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Manual */}
            <motion.div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10 p-5 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-light text-gray-500 tracking-wider mb-2"
                style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('contacts.stats.manual')}
                    </p>
                    <p className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stats.manual}
                    </p>
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* High Confidence */}
            <motion.div
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative z-10 p-5 md:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-light text-gray-500 tracking-wider mb-2"
                style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {t('contacts.stats.highConfidence')}
                    </p>
                    <p className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stats.highConfidence}
                    </p>
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Target className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Recherche et filtres */}
          <motion.div
            className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {/* Mobile: Recherche et filtres */}
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex flex-row items-center gap-2">
              {/* Bouton sélection */}
              {filteredContacts.length > 0 && (
                <motion.button
                  onClick={handleSelectAll}
                    className="rounded-lg px-3 py-2.5 bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                  {selectedContacts.size === filteredContacts.length ? (
                    <CheckSquare className="w-4 h-4 text-gray-900" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-900" />
                  )}
                </motion.button>
              )}
              
              {/* Recherche */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t('contacts.search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                  />
                </div>
              </div>
              
                {/* Filtre */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-auto h-12 rounded-lg bg-white border border-gray-200 py-2.5 px-4 shadow-sm hover:shadow-md transition-all font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                  <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                    {filterStatus !== 'all' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-gray-600"
                      />
                    )}
                  </div>
                </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                  <SelectItem 
                    value="all"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.allStatuses'))}
                    </SelectItem>
                    <SelectItem 
                      value="high_confidence"
                        className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.highConfidence'))}
                    </SelectItem>
                    <SelectItem 
                      value="medium_confidence"
                        className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.mediumConfidence'))}
                    </SelectItem>
                    <SelectItem 
                      value="low_confidence"
                        className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.lowConfidence'))}
                    </SelectItem>
                </SelectContent>
              </Select>
              </div>
              
              {/* Boutons d'export en mobile quand des contacts sont sélectionnés */}
              {selectedContacts.size > 0 && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={handleExportSelectedCSV}
                    disabled={isExporting}
                    variant="outline"
                    className="flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light text-sm py-2.5"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('contacts.selection.exportCSV', { count: selectedContacts.size })}
                  </Button>
                  <Button
                    onClick={handleExportSelectedVCard}
                    disabled={isExporting}
                    variant="outline"
                    className="flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light text-sm py-2.5"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('contacts.selection.exportVCard', { count: selectedContacts.size })}
                  </Button>
                </motion.div>
              )}
            </div>
            
            {/* Desktop: Recherche étendue + bouton sélection + filtres */}
            <div className="hidden md:flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Recherche */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder={t('contacts.search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-base font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  />
                </div>
              </div>
              
              {/* Bouton sélection */}
              {filteredContacts.length > 0 && (
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  className="rounded-lg px-5 py-3 border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {selectedContacts.size === filteredContacts.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      <span>{t('contacts.selection.deselectAll')}</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      <span>{t('contacts.selection.selectAll')}</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Filtres */}
              <div className="flex gap-3">
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-full md:w-48 rounded-lg py-3 px-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Tag className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <SelectValue placeholder={t('contacts.filter.source') || 'Source'} className="font-light" />
                      {filterSource !== 'all' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0"
                        />
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <SelectItem 
                      value="all"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {t('contacts.filter.allSources') || 'Toutes les sources'}
                    </SelectItem>
                    <SelectItem 
                      value="scanner"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {t('contacts.sourceTypes.scanner') || 'Scanné'}
                    </SelectItem>
                    <SelectItem 
                      value="manual"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {t('contacts.sourceTypes.manual') || 'Manuel'}
                    </SelectItem>
                    <SelectItem 
                      value="order"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {t('contacts.sourceTypes.order') || 'Commande'}
                    </SelectItem>
                    <SelectItem 
                      value="appointment"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {t('contacts.sourceTypes.appointment') || 'Rendez-vous'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-56 rounded-lg py-3 px-4 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Filter className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <SelectValue placeholder={t('contacts.filter.confidence')} className="font-light" />
                      {filterStatus !== 'all' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0"
                        />
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[240px] font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    <SelectItem 
                      value="all"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.allStatuses'))}
                    </SelectItem>
                    <SelectItem 
                      value="high_confidence"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.highConfidence'))}
                    </SelectItem>
                    <SelectItem 
                      value="medium_confidence"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.mediumConfidence'))}
                    </SelectItem>
                    <SelectItem 
                      value="low_confidence"
                      className="rounded-md px-4 py-3 my-1 cursor-pointer hover:bg-gray-50 transition-all font-light text-gray-900"
                    >
                      {cleanLabel(t('contacts.filter.lowConfidence'))}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Liste des contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='mt-6'
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                <span className="ml-2 text-gray-500 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('contacts.loading')}</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <motion.div
                className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="relative z-10 p-12 text-center">
                  <motion.div
                    className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-6"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Users className="w-8 h-8 text-gray-600" />
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-light text-gray-900 mb-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {contacts.length === 0 ? t('contacts.emptyState.noContacts') : t('contacts.emptyState.noResults')}
                  </h3>
                  <p className="text-gray-500 mb-6 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {contacts.length === 0 
                      ? t('contacts.emptyState.description')
                      : filterSource !== 'all' 
                        ? t('contacts.emptyState.filterSourceMessage', { source: t(`contacts.sourceLabels.${filterSource}`) || filterSource })
                        : t('contacts.emptyState.noFilterResults')
                    }
                  </p>
                  {contacts.length === 0 && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setShowScanner(true)}
                        className="rounded-lg px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        {t('contacts.scanCard')}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : viewMode === 'kanban' ? (
              /* Vue Kanban */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {kanbanColumns.map((column) => {
                    const columnContacts = contactsByColumn[column.id] || [];
                    return (
                      <KanbanColumn
                        key={column.id}
                        id={column.id}
                        label={column.label}
                        icon={column.icon}
                        gradient={column.gradient}
                        contacts={columnContacts}
                        onViewContact={handleViewContact}
                        onEditContact={handleEditContact}
                        onDeleteContact={(id) => id && handleDeleteContact(id)}
                        getInitials={getInitials}
                        getConfidenceColor={getConfidenceColor}
                        t={t}
                        format={format}
                        currentLanguage={currentLanguage}
                        fr={fr}
                        enUS={enUS}
                        navigate={navigate}
                      />
                    );
                  })}
                </div>
                <DragOverlay>
                  {activeId ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4">
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {contacts.find(c => c.id === activeId)?.full_name || ''}
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" : "space-y-4"}>
                <AnimatePresence>
                  {paginatedContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                    >
                      <motion.div
                        className={`relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow ${contact.id && selectedContacts.has(contact.id) ? 'ring-2 ring-gray-300 bg-gray-50' : ''}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="relative z-10 p-5">
                          {viewMode === 'list' ? (
                            // Vue liste simplifiée - Partie haute uniquement
                            <div className="flex items-center gap-4">
                              {/* Checkbox de sélection */}
                              <button
                                onClick={() => contact.id && handleSelectContact(contact.id)}
                                className="flex-shrink-0 w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                {contact.id && selectedContacts.has(contact.id) && (
                                  <CheckSquare className="w-4 h-4 text-gray-900" />
                                )}
                              </button>
                              
                              {/* Avatar */}
                              <Avatar className="w-12 h-12 border border-gray-200 flex-shrink-0">
                                <AvatarImage src={contact.scan_source_image_url} />
                                <AvatarFallback className="bg-gray-100 text-gray-900 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  {getInitials(contact.full_name || 'U')}
                                </AvatarFallback>
                              </Avatar>
                              
                              {/* Informations principales */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-light text-gray-900 text-base mb-1 truncate tracking-tight"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                    fontWeight: 300,
                                    letterSpacing: '-0.01em',
                                  }}
                                >
                                  {contact.full_name || t('contacts.contactDetails.unknownName')}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2 truncate">
                                  {contact.company && `${contact.company}`}
                                  {contact.company && contact.title && ' • '}
                                  {contact.title}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                                  {contact.email && (
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                      <Mail className="w-4 h-4 text-gray-500" />
                                      <a 
                                        href={`mailto:${contact.email}`}
                                        className="hover:text-gray-900 hover:underline truncate"
                                      >
                                        {contact.email}
                                      </a>
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                      <Phone className="w-4 h-4 text-gray-500" />
                                      <a 
                                        href={`tel:${contact.phone}`}
                                        className="hover:text-gray-900 hover:underline"
                                      >
                                        {contact.phone}
                                      </a>
                                    </div>
                                  )}
                                  {contact.created_at && (
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs sm:text-sm">
                                      <span>
                                        {format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg rounded-lg"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}/crm`)} className="text-gray-900 hover:bg-gray-50 font-light cursor-pointer">
                                    <Zap className="w-4 h-4 mr-2" />
                                    {t('contacts.actions.viewCRM')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewContact(contact)} className="text-gray-900 hover:bg-gray-50 cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2" />
                                    {t('contacts.actions.view')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditContact(contact)} className="text-gray-900 hover:bg-gray-50 cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2" />
                                    {t('contacts.actions.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => contact.id && handleDeleteContact(contact.id)} 
                                    className="text-red-600 hover:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t('contacts.actions.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : (
                            // Vue grille
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3 flex-1">
                                {/* Checkbox de sélection */}
                                <button
                                  onClick={() => contact.id && handleSelectContact(contact.id)}
                                  className="flex-shrink-0 w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  {contact.id && selectedContacts.has(contact.id) && (
                                    <CheckSquare className="w-4 h-4 text-gray-900" />
                                  )}
                                </button>
                                <Avatar className="w-12 h-12 border border-gray-200 group-hover:border-gray-300 transition-all duration-200">
                                  <AvatarImage src={contact.scan_source_image_url} />
                                  <AvatarFallback className="bg-gray-100 text-gray-900 font-light group-hover:bg-gray-200 transition-all duration-200"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {getInitials(contact.full_name || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-light text-gray-900 group-hover:text-gray-900 transition-colors duration-200 truncate tracking-tight"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                      fontWeight: 300,
                                      letterSpacing: '-0.01em',
                                    }}
                                  >
                                    {contact.full_name || t('contacts.contactDetails.unknownName')}
                                  </h3>
                                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200 truncate">
                                    {contact.title} {contact.company && `• ${contact.company}`}
                                  </p>
                                </div>
                              </div>
                            
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 flex-shrink-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end" 
                                  className="w-48 bg-white border border-gray-200 shadow-lg rounded-lg p-2 font-light"
                                  style={{
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                    fontWeight: 300,
                                  }}
                                >
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/contacts/${contact.id}/crm`)}
                                    className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200"
                                  >
                                    <div className="p-1.5 bg-gray-100 rounded-lg">
                                      <Zap className="w-4 h-4 text-gray-900" />
                                    </div>
                                    <span className="font-light text-sm">{t('contacts.actions.viewCRM')}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-2 bg-gray-200" />
                                  <DropdownMenuItem
                                    onClick={() => handleViewContact(contact)}
                                    className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200"
                                  >
                                    <div className="p-1.5 bg-gray-100 rounded-lg">
                                      <Eye className="w-4 h-4 text-gray-900" />
                                    </div>
                                    <span className="font-light text-sm">{t('contacts.actions.view')}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditContact(contact)}
                                    className="flex items-center gap-3 px-3 py-2 text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200"
                                  >
                                    <div className="p-1.5 bg-gray-100 rounded-lg">
                                      <Edit className="w-4 h-4 text-gray-900" />
                                    </div>
                                    <span className="font-light text-sm">{t('contacts.actions.edit')}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-2 bg-gray-200" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteContact(contact.id!)}
                                    className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all duration-200"
                                  >
                                    <div className="p-1.5 bg-red-100 rounded-lg">
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </div>
                                    <span className="font-light text-sm">{t('contacts.actions.delete')}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                          {/* Informations de contact - Uniquement pour la vue grille */}
                          {viewMode === 'grid' && (
                            <>
                              <div className="space-y-2 mb-4 mt-4 pt-4 border-t border-gray-200/50">
                                {contact.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                                      <Mail className="w-3 h-3 text-gray-900" />
                                    </div>
                                    <a 
                                      href={`mailto:${contact.email}`}
                                      className="text-gray-900 hover:text-gray-600 hover:underline transition-colors duration-200 truncate"
                                      title={t('contacts.tooltips.sendEmail', { email: contact.email })}
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                                      <Phone className="w-3 h-3 text-gray-900" />
                                    </div>
                                    <a 
                                      href={`tel:${contact.phone}`}
                                      className="text-gray-900 hover:text-gray-600 hover:underline transition-colors duration-200"
                                      title={t('contacts.tooltips.call', { phone: contact.phone })}
                                    >
                                      {contact.phone}
                                    </a>
                                  </div>
                                )}
                                {contact.address && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                                      <MapPin className="w-3 h-3 text-gray-900" />
                                    </div>
                                    <a 
                                      href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-900 hover:text-gray-600 hover:underline transition-colors duration-200 truncate"
                                      title={t('contacts.tooltips.viewOnMaps')}
                                    >
                                      {contact.address}
                                    </a>
                                  </div>
                                )}
                                {contact.website && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-200">
                                      <Globe className="w-3 h-3 text-gray-900" />
                                    </div>
                                    <a 
                                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-900 hover:text-gray-600 hover:underline transition-colors duration-200 truncate"
                                      title={t('contacts.tooltips.visitWebsite')}
                                    >
                                      {contact.website}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Tags et métadonnées - Uniquement pour la vue grille */}
                              <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200/50">
                                <div className="flex flex-wrap gap-2">
                                  {contact.source_type && (
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-xs font-light bg-gray-100 text-gray-700 whitespace-nowrap",
                                      )}
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {t(`contacts.sourceTypes.${contact.source_type}`) || t('contacts.sourceTypes.imported')}
                                    </Badge>
                                  )}
                                  {contact.scan_confidence && (
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-xs font-light whitespace-nowrap",
                                        getConfidenceColor(contact.scan_confidence)
                                      )}
                                      style={{
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                        fontWeight: 300,
                                      }}
                                    >
                                      {Math.round(contact.scan_confidence * 100)}%
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200 flex-shrink-0">
                                  {contact.created_at && format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Pagination - Uniquement pour grid et list */}
          {viewMode !== 'kanban' && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6"
            >
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredContacts.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Scanner de cartes */}
      {showScanner && (
        <CardScanner
          onContactCreated={handleContactCreated}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <Trash2 className="w-5 h-5" />
              {t('contacts.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="border border-gray-200 text-gray-900 hover:bg-gray-50 rounded-lg shadow-sm font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContact}
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm rounded-lg font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de visualisation du contact */}
      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg rounded-lg max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <Eye className="w-5 h-5" />
              {t('contacts.contactDetails.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.contactDetails.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {contactToView && (
            <div className="space-y-6">
              {/* En-tête du contact */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Avatar className="w-16 h-16 border border-gray-200">
                  <AvatarImage src={contactToView.scan_source_image_url} />
                  <AvatarFallback className="bg-gray-100 text-gray-900 font-light text-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {getInitials(contactToView.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {contactToView.full_name || t('contacts.contactDetails.unknownName')}
                  </h3>
                  <p className="text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {contactToView.title} {contactToView.company && `• ${contactToView.company}`}
                  </p>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactToView.email && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('contacts.contactDetails.email')}</p>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{contactToView.email}</p>
                    </div>
                  </div>
                )}

                {contactToView.phone && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('contacts.contactDetails.phone')}</p>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{contactToView.phone}</p>
                    </div>
                  </div>
                )}

                {contactToView.address && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('contacts.contactDetails.address')}</p>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{contactToView.address}</p>
                    </div>
                  </div>
                )}

                {contactToView.website && (
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Globe className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('contacts.contactDetails.website')}</p>
                      <p className="font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{contactToView.website}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Métadonnées */}
              <div className="flex flex-wrap gap-2">
                {contactToView.source_type && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {t(`contacts.sourceTypes.${contactToView.source_type}`) || t('contacts.sourceTypes.imported')}
                  </Badge>
                )}
                {contactToView.scan_confidence && (
                  <Badge
                    variant="secondary"
                    className={cn("text-xs bg-gray-100 text-gray-700")}
                  >
                    {t('contacts.contactDetails.confidence', { percentage: Math.round(contactToView.scan_confidence * 100) })}
                  </Badge>
                )}
                {contactToView.created_at && (
                  <Badge variant="outline" className="border-gray-200 text-gray-900 bg-white">
                    {t('contacts.contactDetails.createdOn', { date: format(new Date(contactToView.created_at), 'dd/MM/yyyy', { locale: currentLanguage === 'fr' ? fr : enUS }) })}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogAction
              onClick={() => setViewDialogOpen(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-lg font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.contactDetails.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue de création manuelle */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white border border-gray-200 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-light tracking-tight">
              {t('contacts.actions.createManual', 'Ajouter un contact manuellement')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="full_name">{t('contacts.fields.full_name', 'Nom complet')}</Label>
              <Input
                id="full_name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="first_name">{t('contacts.fields.first_name', 'Prénom')}</Label>
              <Input
                id="first_name"
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_name">{t('contacts.fields.last_name', 'Nom')}</Label>
              <Input
                id="last_name"
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">{t('contacts.fields.company', 'Entreprise')}</Label>
              <Input
                id="company"
                value={createForm.company}
                onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="title">{t('contacts.fields.title', 'Poste')}</Label>
              <Input
                id="title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{t('contacts.fields.email', 'Email')}</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">{t('contacts.fields.phone', 'Téléphone')}</Label>
              <Input
                id="phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="notes">{t('contacts.fields.notes', 'Notes')}</Label>
              <Textarea
                id="notes"
                rows={3}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetCreateForm();
              }}
              className="border-gray-200 text-gray-900 hover:bg-gray-50 rounded-lg shadow-sm font-light"
            >
              {t('common.cancel') || 'Annuler'}
            </Button>
            <Button
              onClick={handleCreateContact}
              disabled={isSaving}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm font-light"
            >
              {isSaving
                ? t('common.saving') || 'Enregistrement...'
                : t('contacts.actions.saveContact', 'Enregistrer le contact')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification du contact */}
      <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2 font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >
              <Edit className="w-5 h-5" />
              {t('contacts.editContact.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.editContact.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {contactToEdit && (
            <div className="space-y-6">
              {/* En-tête du contact */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Avatar className="w-16 h-16 border border-gray-200">
                  <AvatarImage src={contactToEdit.scan_source_image_url} />
                  <AvatarFallback className="bg-gray-100 text-gray-900 font-light text-lg"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {getInitials(contactToEdit.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-light text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {contactToEdit.full_name || t('contacts.contactDetails.unknownName')}
                  </h3>
                  <p className="text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {contactToEdit.title} {contactToEdit.company && `• ${contactToEdit.company}`}
                  </p>
                </div>
              </div>

              {/* Formulaire d'édition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h4 className="text-lg font-light text-gray-900 flex items-center gap-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <User className="w-5 h-5" />
                    {t('contacts.editContact.personalInfo')}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="full_name" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.fullName')}
                      </Label>
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => handleFormChange('full_name', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.fullNamePlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                      <Label htmlFor="first_name" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                          {t('contacts.editContact.firstName')}
                        </Label>
                        <Input
                          id="first_name"
                          value={editForm.first_name}
                          onChange={(e) => handleFormChange('first_name', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                          placeholder={t('contacts.editContact.firstNamePlaceholder')}
                        />
                      </div>
                      <div>
                      <Label htmlFor="last_name" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                          {t('contacts.editContact.lastName')}
                        </Label>
                        <Input
                          id="last_name"
                          value={editForm.last_name}
                          onChange={(e) => handleFormChange('last_name', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                          placeholder={t('contacts.editContact.lastNamePlaceholder')}
                        />
                      </div>
                    </div>

                    <div>
                    <Label htmlFor="title" className="text-gray-900 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                        {t('contacts.editContact.title')}
                      </Label>
                      <Input
                        id="title"
                        value={editForm.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                      className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                        placeholder={t('contacts.editContact.titlePlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-4">
                  <h4 className="text-lg font-light text-gray-900 flex items-center gap-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <Building className="w-5 h-5" />
                    {t('contacts.editContact.professionalInfo')}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="company" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.company')}
                      </Label>
                      <Input
                        id="company"
                        value={editForm.company}
                        onChange={(e) => handleFormChange('company', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.companyPlaceholder')}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="website"
                        className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.website')}
                      </Label>
                      <Input
                        id="website"
                        value={editForm.website}
                        onChange={(e) => handleFormChange('website', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.websitePlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Informations de contact */}
                <div className="space-y-4">
                  <h4 className="text-lg font-light text-gray-900 flex items-center gap-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <Phone className="w-5 h-5" />
                    {t('contacts.editContact.contactInfo')}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="email" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.emailPlaceholder')}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.phone')}
                      </Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="bg-white border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 px-4 py-2 rounded-lg shadow-sm font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.phonePlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Adresse et notes */}
                <div className="space-y-4">
                  <h4 className="text-lg font-light text-gray-900 flex items-center gap-2 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    <MapPin className="w-5 h-5" />
                    {t('contacts.editContact.addressNotes')}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label
                        htmlFor="address"
                        className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.address')}
                      </Label>
                      <Textarea
                        id="address"
                        value={editForm.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        className="border-gray-200 focus:border-gray-900 focus:ring-gray-900 min-h-[80px] bg-white text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.addressPlaceholder')}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {t('contacts.editContact.notes')}
                      </Label>
                      <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        className="border-gray-200 focus:border-gray-900 focus:ring-gray-900 min-h-[80px] bg-white text-gray-900 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                        placeholder={t('contacts.editContact.notesPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel
              onClick={() => setEditDialogOpen(false)}
              className="border border-gray-200 text-gray-900 hover:bg-gray-50 rounded-lg shadow-sm font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {t('contacts.editContact.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveContact}
              disabled={isSaving}
              className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-lg disabled:opacity-50 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('contacts.editContact.saving')}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('contacts.editContact.save')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
};

export default Contacts;
