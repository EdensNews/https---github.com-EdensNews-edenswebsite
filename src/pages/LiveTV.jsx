import { useState, useEffect } from 'react';
import { streamSettingsRepo } from '@/api/repos/streamSettingsRepo';
import { useLanguage } from '@/components/LanguageContext';
import { Tv, Signal, Youtube } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LiveTV() {
    const [streamSettings, setStreamSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();

    useEffect(() => {
        const loadStreamSettings = async () => {
            setIsLoading(true);
            try {
                const latest = await streamSettingsRepo.getLatest();
                if (latest) {
                    setStreamSettings(latest);
                }
            } catch (error) {
                console.error('Failed to load stream settings:', error);
            }
            setIsLoading(false);
        };
        loadStreamSettings();
    }, []);

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            const videoId = urlObj.searchParams.get('v');
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1`;
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
        return null;
    };
    
    const streamTitle = streamSettings?.subtitle || (language === 'kn' ? 'ಈಡನ್ ನ್ಯೂಸ್ ಲೈವ್' : 'Eden News Live');
    const embedUrl = getYouTubeEmbedUrl(streamSettings?.stream_url);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Skeleton className="h-10 w-64 mb-6" />
                <Skeleton className="aspect-video rounded-2xl" />
            </div>
        );
    }
    
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-6">
                <Tv className="w-10 h-10 text-red-600"/>
                <h1 className={`text-4xl font-extrabold text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {streamTitle}
                </h1>
            </div>

            <div className="aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative border-4 border-gray-200 dark:border-gray-700">
                {streamSettings?.is_live && embedUrl ? (
                    <>
                        <iframe
                            src={embedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            <Signal className="w-4 h-4 animate-pulse" />
                            LIVE
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <Youtube className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className={`text-2xl font-bold text-gray-500 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? 'ಸ್ಟ್ರೀಮ್ ಆಫ್‌ಲೈನ್ ಆಗಿದೆ' : 'Stream is Offline'}
                        </h3>
                         <p className={`text-gray-400 dark:text-gray-500 mt-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? 'ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Please check back later.'}
                        </p>
                    </div>
                )}
            </div>

            <div className={`mt-6 text-center text-gray-600 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                 <p>
                     {streamSettings?.is_live && embedUrl
                         ? (language === 'kn' ? 'ನಮ್ಮ YouTube ನೇರ ಪ್ರಸಾರವನ್ನು ವೀಕ್ಷಿಸಿ.' : 'Watch our live broadcast on YouTube.')
                         : (language === 'kn' ? 'ಪ್ರಸ್ತುತ ಸ್ಟ್ರೀಮ್ ಆಫ್‌ಲೈನ್ ಆಗಿದೆ.' : 'The stream is currently offline.')
                     }
                 </p>
            </div>
        </div>
    );
}