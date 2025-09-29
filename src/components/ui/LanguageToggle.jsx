import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LanguageToggle() {
    const { language, setLanguage, isLoading, supportedLanguages } = useLanguage();

    if (isLoading) {
        return (
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" disabled>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </Button>
        );
    }

    return (
        <div className="relative">
            <select
                aria-label="Select language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-orange-600 border border-orange-300 rounded-md px-2 py-1 text-xs focus:outline-none hover:bg-orange-50/10"
            >
                {supportedLanguages.map((lng) => (
                    <option key={lng} value={lng} className="bg-gray-900 text-white">
                        {lng.toUpperCase()}
                    </option>
                ))}
            </select>
        </div>
    );
}