import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import BusinessCardContent from "./BusinessCardContent";
import BusinessCardMedia from "./BusinessCardMedia";
import BusinessCardActions from "./BusinessCardActions";
import EventDisplaySection from "../EventDisplaySection";
import ProductDisplaySection from "../ProductDisplaySection";

interface CardSliderContentProps {
    activeSlider: 'liens' | 'boutique';
    description?: string;
    websites: any[];
    loadingImages: Set<string>;
    onImageLoad: (url: string) => void;
    cardId?: string;
    trackClick: (params: any) => void;
    combinedMediaContent: any[];
    onSwitchToBoutique: () => void;
    onQRCodeClick: () => void;
    onVCardClick: () => void;
    onAppointmentClick: () => void;
    canBookAppointments: boolean;
    events: any[];
    products: any[];
    digitalProducts: any[];
    onProductClick: (product: any) => void;
    portfolioSettings: any;
    portfolioProjectsCount: number;
    cardUrl?: string;
}

const CardSliderContent: React.FC<CardSliderContentProps> = ({
    activeSlider,
    description,
    websites,
    loadingImages,
    onImageLoad,
    cardId,
    trackClick,
    combinedMediaContent,
    onSwitchToBoutique,
    onQRCodeClick,
    onVCardClick,
    onAppointmentClick,
    canBookAppointments,
    events,
    products,
    digitalProducts,
    onProductClick,
    portfolioSettings,
    portfolioProjectsCount,
    cardUrl
}) => {
    return (
        <div className="py-6 relative">
            <AnimatePresence mode="wait" key="main-slider">
                {activeSlider === 'liens' ? (
                    <motion.div
                        key="liens-slider"
                        initial={{ opacity: 0, x: -30, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, y: -20, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                            duration: 0.5,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        style={{ willChange: 'transform, opacity' }}
                        className="relative z-10 space-y-6 bg-white/10 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-6 shadow-lg"
                    >
                        <BusinessCardContent
                            description={description}
                            websites={websites}
                            loadingImages={loadingImages}
                            onImageLoad={onImageLoad}
                            onWebsiteClick={(website) => {
                                if (cardId) {
                                    trackClick({
                                        cardId,
                                        linkType: 'website',
                                        linkLabel: website.label || website.platform,
                                        linkUrl: website.url
                                    });
                                }
                            }}
                        />

                        {combinedMediaContent.length > 0 && (
                            <BusinessCardMedia
                                combinedMediaContent={combinedMediaContent}
                                onSwitchToBoutique={onSwitchToBoutique}
                            />
                        )}

                        <BusinessCardActions
                            onQRCodeClick={onQRCodeClick}
                            onVCardClick={onVCardClick}
                            onAppointmentClick={onAppointmentClick}
                            canBookAppointments={canBookAppointments}
                        />
                    </motion.div>
                ) : activeSlider === 'boutique' ? (
                    <motion.div
                        key="boutique-slider"
                        initial={{ opacity: 0, x: 30, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, y: -20, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                            duration: 0.5,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        style={{ willChange: 'transform, opacity' }}
                        className="relative z-10 space-y-6 bg-white/15 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
                    >
                        {events && events.length > 0 && (
                            <EventDisplaySection
                                events={events}
                                cardId={cardId}
                                onEventClick={(eventId) => {
                                    window.open(`/events/${eventId}`, '_blank');
                                }}
                            />
                        )}

                        <ProductDisplaySection
                            products={products}
                            digitalProducts={digitalProducts}
                            onProductClick={onProductClick}
                            onSwitchToBoutique={onSwitchToBoutique}
                            cardId={cardId}
                            portfolioSettings={portfolioSettings}
                            portfolioProjectsCount={portfolioProjectsCount}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default CardSliderContent;
