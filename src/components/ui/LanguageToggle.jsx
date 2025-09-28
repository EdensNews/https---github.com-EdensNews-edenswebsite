import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LanguageToggle() {
    const { language, toggleLanguage, isLoading } = useLanguage();

    if (isLoading) {
        return (
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" disabled>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </Button>
        );
    }

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleLanguage} 
            className="rounded-full w-10 h-10 hover:bg-orange-100 transition-colors"
            aria-label="Toggle language"
        >
            {language === 'kn' ? (
                <span className="font-kannada text-lg font-bold text-orange-600">ಕ</span>
            ) : (
                <span className="text-lg font-bold text-orange-600">EN</span>
            )}
        </Button>
    );
}