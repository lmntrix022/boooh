import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, Edit2, User, Linkedin, Twitter, ExternalLink } from 'lucide-react';
import { MultiImageUpload } from './MultiImageUpload';

import { useLanguage } from '@/hooks/useLanguage';

export interface Speaker {
    id: string;
    name: string;
    role: string;
    company: string;
    bio?: string;
    avatar_url?: string;
    socials?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
}

interface SpeakersManagerProps {
    speakers: Speaker[];
    onChange: (speakers: Speaker[]) => void;
}

export const SpeakersManager: React.FC<SpeakersManagerProps> = ({ speakers = [], onChange }) => {
    const { t } = useLanguage();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);

    // Form state
    const [formData, setFormData] = useState<Partial<Speaker>>({});

    const resetForm = () => {
        setFormData({});
        setEditingSpeaker(null);
    };

    const handleOpenDialog = (speaker?: Speaker) => {
        if (speaker) {
            setEditingSpeaker(speaker);
            setFormData({ ...speaker });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingSpeaker) {
            // Update existing
            const updatedSpeakers = speakers.map(s =>
                s.id === editingSpeaker.id ? { ...s, ...formData } as Speaker : s
            );
            onChange(updatedSpeakers);
        } else {
            // Add new
            const newSpeaker: Speaker = {
                id: crypto.randomUUID(),
                name: formData.name || '',
                role: formData.role || '',
                company: formData.company || '',
                bio: formData.bio || '',
                avatar_url: formData.avatar_url || '',
                socials: formData.socials || {},
            };
            onChange([...speakers, newSpeaker]);
        }
        setIsDialogOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        onChange(speakers.filter(s => s.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light tracking-tight text-gray-900"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.02em' }}
                >
                    {t('events.form.speakers.title')}
                </h3>
                <Button
                    onClick={() => handleOpenDialog()}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-light border-gray-200 hover:bg-gray-50 transition-all"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('events.form.speakers.add')}
                </Button>
            </div>

            {speakers.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 bg-gray-50/30">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="font-light" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                        {t('events.form.speakers.noSpeakers')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {speakers.map((speaker, idx) => (
                        <Card key={speaker.id} className="relative group overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white/60 backdrop-blur-sm">
                            <CardContent className="p-5 flex items-center gap-5">
                                <Avatar className="h-16 w-16 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                    <AvatarImage src={speaker.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-gray-50 text-gray-400 font-light">{speaker.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-light text-gray-900 truncate tracking-tight"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.01em' }}
                                    >
                                        {speaker.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 truncate font-light"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                    >
                                        {speaker.role}
                                    </p>
                                    {speaker.company && (
                                        <p className="text-xs text-gray-400 truncate font-light mt-0.5"
                                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                        >
                                            {speaker.company}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all absolute top-3 right-3 translate-y-1 group-hover:translate-y-0">
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 hover:bg-white" onClick={() => handleOpenDialog(speaker)}>
                                        <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                                    </Button>
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 hover:bg-white text-red-500 hover:text-red-600" onClick={() => handleDelete(speaker.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl rounded-3xl border-none shadow-2xl overflow-hidden p-0">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-light tracking-tight text-gray-900"
                            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.02em' }}
                        >
                            {editingSpeaker ? t('events.form.speakers.edit') : t('events.form.speakers.add')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-8 pb-8 space-y-6">
                        {/* Profile Photo Section */}
                        <div className="space-y-3">
                            <Label className="text-sm font-light text-gray-400 uppercase tracking-widest text-center block"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.coverImage')}
                            </Label>
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-100 p-1 bg-gray-50/50">
                                    <MultiImageUpload
                                        images={formData.avatar_url ? [formData.avatar_url] : []}
                                        onChange={(urls) => setFormData({ ...formData, avatar_url: urls[0] || '' })}
                                        maxImages={1}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Basic Info Grid */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-light text-gray-600 ml-1"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    {t('events.form.speakers.name')} *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Sarah Connor"
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-light text-gray-600 ml-1"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                >
                                    {t('events.form.speakers.role')}
                                </Label>
                                <Input
                                    id="role"
                                    value={formData.role || ''}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="e.g. Product Manager"
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-sm font-light text-gray-600 ml-1"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.speakers.company')}
                            </Label>
                            <Input
                                id="company"
                                value={formData.company || ''}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="e.g. Tech Corp"
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio" className="text-sm font-light text-gray-600 ml-1"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.speakers.bio')}
                            </Label>
                            <Input
                                id="bio"
                                value={formData.bio || ''}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about the speaker..."
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            />
                        </div>

                        {/* Socials Section */}
                        <div className="space-y-4 pt-2">
                            <Label className="text-xs font-light text-gray-400 uppercase tracking-widest ml-1 block"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.speakers.socials')}
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                        <Linkedin className="h-3.5 w-3.5" />
                                    </div>
                                    <Input
                                        value={formData.socials?.linkedin || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            socials: { ...formData.socials, linkedin: e.target.value }
                                        })}
                                        placeholder="LinkedIn"
                                        className="pl-9 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-10 text-xs font-light"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <Twitter className="h-3.5 w-3.5" />
                                    </div>
                                    <Input
                                        value={formData.socials?.twitter || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            socials: { ...formData.socials, twitter: e.target.value }
                                        })}
                                        placeholder="Twitter"
                                        className="pl-9 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-10 text-xs font-light"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </div>
                                    <Input
                                        value={formData.socials?.website || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            socials: { ...formData.socials, website: e.target.value }
                                        })}
                                        placeholder="Website"
                                        className="pl-9 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-10 text-xs font-light"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                    />
                                </div>
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
                                {editingSpeaker ? t('common.saveChanges') : t('events.form.speakers.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
