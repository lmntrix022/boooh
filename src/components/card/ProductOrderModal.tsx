import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface ProductOrderModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedProduct: any;
    orderForm: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        message: string;
    };
    onFormChange: (field: string, value: string) => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
}

const ProductOrderModal: React.FC<ProductOrderModalProps> = ({
    isOpen,
    onOpenChange,
    selectedProduct,
    orderForm,
    onFormChange,
    onSubmit,
    isSubmitting
}) => {
    const validateForm = () => {
        return orderForm.firstName.trim() !== '' &&
            orderForm.lastName.trim() !== '' &&
            orderForm.email.trim() !== '' &&
            orderForm.address.trim() !== '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] w-[90vw] bg-white border border-gray-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
                <div className="relative">
                    <div className="bg-gray-900 p-3 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>

                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-white">Commander</DialogTitle>
                                    <DialogDescription className="text-green-100 text-xs">Finalisez votre commande</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-3">
                        {selectedProduct && (
                            <div className="space-y-3">
                                <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                                    {selectedProduct.image || selectedProduct.thumbnail_url ? (
                                        <img
                                            src={selectedProduct.image || selectedProduct.thumbnail_url}
                                            alt={selectedProduct.name || selectedProduct.title}
                                            className="w-12 h-12 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                                            <ShoppingCart className="h-4 w-4 text-white" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">
                                            {selectedProduct.name || selectedProduct.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-green-600">
                                                {selectedProduct.price || (selectedProduct.is_free ? 'Gratuit' : `${selectedProduct.price} ${selectedProduct.currency}`)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-800">Informations de livraison</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                                            <input
                                                type="text"
                                                value={orderForm.firstName}
                                                onChange={(e) => onFormChange('firstName', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                                            <input
                                                type="text"
                                                value={orderForm.lastName}
                                                onChange={(e) => onFormChange('lastName', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={orderForm.email}
                                            onChange={(e) => onFormChange('email', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                                        <input
                                            type="tel"
                                            value={orderForm.phone}
                                            onChange={(e) => onFormChange('phone', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Adresse *</label>
                                        <textarea
                                            value={orderForm.address}
                                            onChange={(e) => onFormChange('address', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent h-12 resize-none text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <motion.button
                                        onClick={() => onOpenChange(false)}
                                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-all text-xs"
                                    >
                                        Annuler
                                    </motion.button>
                                    <motion.button
                                        onClick={onSubmit}
                                        disabled={isSubmitting || !validateForm()}
                                        className={`flex-1 py-2 px-3 rounded-lg font-medium shadow-lg transition-all flex items-center justify-center gap-1 text-xs ${isSubmitting || !validateForm() ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                                    >
                                        {isSubmitting ? 'Envoi...' : 'Confirmer'}
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductOrderModal;
