import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, HelpCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import { useLanguage } from '@/hooks/useLanguage';

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface FAQManagerProps {
    faq: FAQItem[];
    onChange: (faq: FAQItem[]) => void;
}

export const FAQManager: React.FC<FAQManagerProps> = ({ faq = [], onChange }) => {
    const { t } = useLanguage();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
    const [formData, setFormData] = useState<Partial<FAQItem>>({});

    const resetForm = () => {
        setFormData({});
        setEditingItem(null);
    };

    const handleOpenDialog = (item?: FAQItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.question || !formData.answer) return;

        if (editingItem) {
            const updatedFAQ = faq.map(item =>
                item.id === editingItem.id ? { ...item, ...formData } as FAQItem : item
            );
            onChange(updatedFAQ);
        } else {
            const newItem: FAQItem = {
                id: crypto.randomUUID(),
                question: formData.question || '',
                answer: formData.answer || '',
            };
            onChange([...faq, newItem]);
        }
        setIsDialogOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        onChange(faq.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light tracking-tight text-gray-900"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.02em' }}
                >
                    {t('events.form.faq.title')}
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
                    {t('events.form.faq.add')}
                </Button>
            </div>

            {faq.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400 bg-gray-50/30">
                    <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="font-light" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}>
                        {t('events.form.faq.noFAQ')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {faq.map((item) => (
                        <Card key={item.id} className="group overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white/60 backdrop-blur-sm">
                            <CardContent className="p-5 flex gap-5">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                        <HelpCircle className="h-5 w-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-light text-gray-900 tracking-tight"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontWeight: 300, letterSpacing: '-0.01em' }}
                                    >
                                        {item.question}
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-2 font-light leading-relaxed"
                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                                    >
                                        {item.answer}
                                    </p>
                                </div>
                                <div className="flex items-start gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50" onClick={() => handleOpenDialog(item)}>
                                        <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                                    </Button>
                                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50 text-red-500" onClick={() => handleDelete(item.id)}>
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
                            {editingItem ? t('events.form.faq.edit') : t('events.form.faq.add')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-8 pb-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="question" className="text-sm font-light text-gray-600 ml-1"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.faq.question')}
                            </Label>
                            <Input
                                id="question"
                                value={formData.question || ''}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="e.g. Is parking available?"
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all h-11 font-light"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="answer" className="text-sm font-light text-gray-600 ml-1"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            >
                                {t('events.form.faq.answer')}
                            </Label>
                            <Textarea
                                id="answer"
                                value={formData.answer || ''}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="Provide a helpful answer..."
                                rows={4}
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all resize-none font-light leading-relaxed"
                                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontWeight: 300 }}
                            />
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
                                {editingItem ? t('common.saveChanges') : t('events.form.faq.save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
