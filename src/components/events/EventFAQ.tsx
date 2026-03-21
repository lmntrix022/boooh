import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
    question: string;
    answer: string;
}

interface EventFAQProps {
    faq?: FAQItem[];
}

export const EventFAQ: React.FC<EventFAQProps> = ({ faq }) => {
    if (!faq || faq.length === 0) return null;

    return (
        <div className="py-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 w-1.5 h-6 rounded-full" />
                FAQ
            </h3>

            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                    {faq.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-b-gray-100 last:border-0">
                            <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-emerald-700 hover:no-underline py-4">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 leading-relaxed pb-4">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
};
