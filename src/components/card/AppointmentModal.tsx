import React, { Suspense, lazy } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Calendar, Loader2, X } from "lucide-react";

// Lazy load AppointmentForm
const AppointmentForm = lazy(() => import("@/components/AppointmentForm"));

interface AppointmentModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    cardId?: string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onOpenChange,
    cardId
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-[600px] bg-white border border-gray-200 shadow-2xl rounded-2xl sm:rounded-3xl p-0 overflow-hidden mx-0 max-h-[90vh] overflow-y-auto [&>button]:hidden">
                <div className="relative">
                    <div className="bg-gray-900 p-4 sm:p-6 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                        <DialogHeader className="relative z-10">
                            <DialogClose className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                                <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                <span className="sr-only">Fermer</span>
                            </DialogClose>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg sm:text-2xl font-bold text-white">Prendre un rendez-vous</DialogTitle>
                                    <DialogDescription className="text-blue-100 text-xs sm:text-sm">Réservez votre créneau en quelques clics</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-4 sm:p-6">
                        <Suspense fallback={<div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>}>
                            <AppointmentForm
                                cardId={cardId || ''}
                                onSuccess={() => onOpenChange(false)}
                                onCancel={() => onOpenChange(false)}
                            />
                        </Suspense>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AppointmentModal;
