import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Clock, MapPin, Tag } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import { useLanguage } from '@/hooks/useLanguage';

export interface AgendaItem {
    id: string;
    time: string; // "10:00"
    endTime?: string; // "11:00"
    title: string;
    description?: string;
    location?: string;
    tag?: string; // "Keynote", "Break", etc.
}

interface AgendaManagerProps {
    agenda: AgendaItem[];
    onChange: (agenda: AgendaItem[]) => void;
}

export const AgendaManager: React.FC<AgendaManagerProps> = ({ agenda = [], onChange }) => {
    const { t } = useLanguage();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
    const [formData, setFormData] = useState<Partial<AgendaItem>>({});

    const resetForm = () => {
        setFormData({});
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: AgendaItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.time) return;

        if (editingItem) {
            const updatedAgenda = agenda.map(item =>
                item.id === editingItem.id ? { ...item, ...formData } as AgendaItem : item
            );
            // Sort by time
            updatedAgenda.sort((a, b) => a.time.localeCompare(b.time));
            onChange(updatedAgenda);
        } else {
            const newItem: AgendaItem = {
                id: crypto.randomUUID(),
                time: formData.time || '09:00',
                endTime: formData.endTime,
                title: formData.title || '',
                description: formData.description,
                location: formData.location,
                tag: formData.tag,
            };
            const updatedAgenda = [...agenda, newItem];
            // Sort by time
            updatedAgenda.sort((a, b) => a.time.localeCompare(b.time));
            onChange(updatedAgenda);
        }
        setIsDialogOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        onChange(agenda.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light tracking-tight text-gray-900"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.02em' }}
                >
                    {t('events.form.agenda.title')}
                </h3>
                <Button
                    onClick={() => handleOpenDialog()}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-light border-gray-200 hover:bg-gray-50 transition-all font-light"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('events.form.agenda.add')}
                </Button>
            </div>

            <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {agenda.length === 0 && (
                    <div className="text-center p-12 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 bg-white relative z-10">
                        <Clock className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <p className="font-light" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                            {t('events.form.agenda.noAgenda')}
                        </p>
                    </div>
                )}

                {agenda.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-2">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#FAFAFA] bg-gray-900 shadow-xl shadow-gray-200 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:static transition-transform group-hover:scale-110">
                            <Clock className="h-4 w-4 text-white" />
                        </div>

                        {/* Content info */}
                        <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 ml-14 md:ml-0 bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm group-hover:shadow-md transition-all relative rounded-2xl overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-light text-xs text-gray-900 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                    >
                                        {item.time} {item.endTime ? `- ${item.endTime}` : ''}
                                    </span>
                                    {item.tag && (
                                        <span className="text-[10px] uppercase tracking-wider bg-gray-900 text-white px-2 py-1 rounded-lg"
                                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 500 }}
                                        >
                                            {item.tag}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h4 className="text-lg font-light text-gray-900 tracking-tight"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.01em' }}
                            >
                                {item.title}
                            </h4>
                            {item.description && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2 font-light"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    {item.description}
                                </p>
                            )}
                            {item.location && (
                                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 font-light"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    <MapPin className="h-3 w-3" /> {item.location}
                                </div>
                            )}

                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 flex gap-1.5">
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50" onClick={() => handleOpenDialog(item)}>
                                    <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                                </Button>
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50 text-red-500" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl overflow-hidden p-0">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight text-gray-900"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.02em' }}
                        >
                            {editingItem ? t('events.form.agenda.edit') : t('events.form.agenda.add')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-8 pb-8 space-y-6">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-sm font-light text-gray-600 ml-1"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    {t('events.form.agenda.startTime')} *
                                </Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time || ''}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime" className="text-sm font-light text-gray-600 ml-1"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    {t('events.form.agenda.endTime')}
                                </Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime || ''}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-light text-gray-600 ml-1"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.agenda.sessionTitle')} *
                            </Label>
                            <Input
                                id="title"
                                value={formData.title || ''}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Keynote Speech"
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-light text-gray-600 ml-1"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.agenda.sessionDetails')}
                            </Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief details about this session..."
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all min-h-[100px] resize-none font-light"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-sm font-light text-gray-600 ml-1 flex items-center gap-1.5"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    <MapPin className="h-3 w-3" /> {t('events.form.agenda.location')}
                                </Label>
                                <Input
                                    id="location"
                                    value={formData.location || ''}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Main Hall"
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tag" className="text-sm font-light text-gray-600 ml-1 flex items-center gap-1.5"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    <Tag className="h-3 w-3" /> {t('events.form.agenda.tag')}
                                </Label>
                                <Input
                                    id="tag"
                                    value={formData.tag || ''}
                                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                    placeholder="e.g. Workshop"
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1 rounded-xl font-light text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-[2] rounded-xl font-light bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {editingItem ? t('common.saveChanges') : t('events.form.agenda.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
