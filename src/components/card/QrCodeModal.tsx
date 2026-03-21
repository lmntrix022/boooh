import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { QrCode, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from '@/hooks/useLanguage';

interface QrCodeModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    cardUrl?: string;
    name: string;
    onDownload: () => Promise<void>;
    onShare: () => Promise<void>;
    isDownloading: boolean;
    isSharing: boolean;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({
    isOpen,
    onOpenChange,
    cardUrl,
    name,
    onDownload,
    onShare,
    isDownloading,
    isSharing
}) => {
    const { t } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-[500px] bg-white border border-gray-200 shadow-2xl rounded-2xl sm:rounded-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto [&>button]:hidden">
                <div className="relative">
                    {/* Header avec gradient et icône */}
                    <div className="bg-gray-900 p-4 sm:p-6 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-14 translate-x-14"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>

                        <DialogHeader className="relative z-10">
                            <DialogClose className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors">
                                <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                <span className="sr-only">Fermer</span>
                            </DialogClose>
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg sm:text-2xl font-bold text-white">{t('businessCard.scanQRTitle')}</DialogTitle>
                                    <DialogDescription className="text-indigo-100 text-xs sm:text-sm">{t('businessCard.scanQRDescription')}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    {/* Contenu avec QR Code stylisé */}
                    <div className="p-4 sm:p-8">
                        <div className="flex flex-col items-center">
                            {cardUrl && (
                                <div className="relative mb-6">
                                    {/* Conteneur du QR Code avec effets */}
                                    <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl flex items-center justify-center p-3 sm:p-4 border-4 border-indigo-100">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}`}
                                            alt="QR Code"
                                            className="w-full h-full rounded-lg"
                                        />
                                    </div>

                                    {/* Effet de halo autour du QR Code */}
                                    <div className="absolute inset-0 bg-gray-100 rounded-2xl blur-xl -z-10 scale-110"></div>
                                </div>
                            )}

                            <div className="text-center space-y-3">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800">{t('businessCard.digitalBusinessCard')}</h3>
                                <p className="text-gray-600 text-xs sm:text-sm max-w-sm px-2 sm:px-0">
                                    {t('businessCard.scanQRInstructions')}
                                </p>

                                {/* Boutons d'action stylisés */}
                                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 w-full">
                                    <motion.button
                                        onClick={onDownload}
                                        disabled={isDownloading}
                                        className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${isDownloading
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                        whileHover={!isDownloading ? { scale: 1.02 } : {}}
                                        whileTap={!isDownloading ? { scale: 0.98 } : {}}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Téléchargement...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Télécharger
                                            </>
                                        )}
                                    </motion.button>

                                    <motion.button
                                        onClick={onShare}
                                        disabled={isSharing}
                                        className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${isSharing
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        whileHover={!isSharing ? { scale: 1.02 } : {}}
                                        whileTap={!isSharing ? { scale: 0.98 } : {}}
                                    >
                                        {isSharing ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Partage...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                                </svg>
                                                Partager
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QrCodeModal;
