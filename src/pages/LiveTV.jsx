import { useState, useEffect } from 'react';
import { streamSettingsRepo } from '@/api/repos/streamSettingsRepo';
import { scheduleRepo } from '@/api/repos/scheduleRepo';
import { useLanguage } from '@/components/LanguageContext';
import { Tv, Signal, Youtube, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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

    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            const videoId = urlObj.searchParams.get('v');
            return videoId;
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
        return null;
    };

    const getYouTubeEmbedUrl = (url) => {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1`;
        }
        return null;
    };

    const getYouTubeChatUrl = (url) => {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
            return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`;
        }
        return null;
    };
    
    const streamTitle = streamSettings?.subtitle || (language === 'kn' ? 'ಈಡನ್ ನ್ಯೂಸ್ ಲೈವ್' : 'Eden News Live');
    const embedUrl = getYouTubeEmbedUrl(streamSettings?.stream_url);
    const chatUrl = getYouTubeChatUrl(streamSettings?.stream_url);

    // Load broadcast schedule from database
    const [broadcastSchedule, setBroadcastSchedule] = useState([]);
    useEffect(() => {
        const loadSchedule = async () => {
            try {
                // Fetch schedule from database
                const scheduleData = await scheduleRepo.list();
                
                // Check current time to mark live shows
                const now = new Date();
                const currentDay = now.getDay();
                const currentTime = now.toTimeString().slice(0, 5); // HH:MM
                
                // Transform and format schedule data
                const formattedSchedule = scheduleData.map(item => {
                    const startTime = item.start_time.slice(0, 5);
                    const endTime = item.end_time.slice(0, 5);
                    const isCurrentlyLive = item.day_of_week === currentDay && 
                                          currentTime >= startTime && 
                                          currentTime <= endTime;
                    
                    return {
                        day: language === 'kn' ? (item.day_name_kn || item.day_name_en) : item.day_name_en,
                        time: `${startTime} - ${endTime}`,
                        show: (() => {
                            if (language === 'kn') return item.show_name_kn || item.show_name_en;
                            if (language === 'ta') return item.show_name_ta || item.show_name_en;
                            if (language === 'te') return item.show_name_te || item.show_name_en;
                            if (language === 'hi') return item.show_name_hi || item.show_name_en;
                            if (language === 'ml') return item.show_name_ml || item.show_name_en;
                            return item.show_name_en;
                        })(),
                        isLive: isCurrentlyLive
                    };
                });
                
                setBroadcastSchedule(formattedSchedule);
            } catch (error) {
                console.error('Failed to load schedule:', error);
                
                // Fallback to hardcoded data if database fetch fails
                const fallbackSchedule = [
                    { 
                        day: language === 'kn' ? 'ಸೋಮವಾರ' : 'Monday', 
                        time: '6:00 PM - 8:00 PM', 
                        show: language === 'kn' ? 'ಸಂಜೆ ಸುದ್ದಿ' : 'Evening News',
                        isLive: false
                    },
                    { 
                        day: language === 'kn' ? 'ಮಂಗಳವಾರ' : 'Tuesday', 
                        time: '6:00 PM - 8:00 PM', 
                        show: language === 'kn' ? 'ವಿಶೇಷ ವರದಿ' : 'Special Report',
                        isLive: false
                    },
                    { 
                        day: language === 'kn' ? 'ಬುಧವಾರ' : 'Wednesday', 
                        time: '6:00 PM - 8:00 PM', 
                        show: language === 'kn' ? 'ಸಂದರ್ಶನ ವಿಶೇಷ' : 'Interview Special',
                        isLive: false
                    },
                    { 
                        day: language === 'kn' ? 'ಗುರುವಾರ' : 'Thursday', 
                        time: '6:00 PM - 8:00 PM', 
                        show: language === 'kn' ? 'ರಾಜಕೀಯ ಚರ್ಚೆ' : 'Political Debate',
                        isLive: false
                    },
                    { 
                        day: language === 'kn' ? 'ಶುಕ್ರವಾರ' : 'Friday', 
                        time: '6:00 PM - 8:00 PM', 
                        show: language === 'kn' ? 'ವಾರದ ಸುದ್ದಿ' : 'Week in Review',
                        isLive: false
                    },
                    { 
                        day: language === 'kn' ? 'ಶನಿವಾರ' : 'Saturday', 
                        time: '7:00 PM - 9:00 PM', 
                        show: language === 'kn' ? 'ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮ' : 'Special Program',
                        isLive: false
                    },
                    { 
                        day: language === 'kn' ? 'ಭಾನುವಾರ' : 'Sunday', 
                        time: '7:00 PM - 9:00 PM', 
                        show: language === 'kn' ? 'ವಾರಾಂತ್ಯ ವಿಶೇಷ' : 'Weekend Special',
                        isLive: false
                    },
                ];
                setBroadcastSchedule(fallbackSchedule);
            }
        };
        loadSchedule();
    }, [language]);

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Skeleton className="h-10 w-64 mb-6" />
                <Skeleton className="aspect-video rounded-2xl" />
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Tv className="w-10 h-10 text-red-600 animate-pulse"/>
                <h1 className={`text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {streamTitle}
                </h1>
            </div>

            {/* Video Player + Live Chat Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Video Player - 2/3 width on desktop */}
                <div className="lg:col-span-2">
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
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-breaking-pulse">
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
                    
                    {/* Video Description */}
                    <div className={`mt-4 text-center text-gray-600 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        <p>
                            {streamSettings?.is_live && embedUrl
                                ? (language === 'kn' ? 'ನಮ್ಮ YouTube ನೇರ ಪ್ರಸಾರವನ್ನು ವೀಕ್ಷಿಸಿ.' : 'Watch our live broadcast on YouTube.')
                                : (language === 'kn' ? 'ಪ್ರಸ್ತುತ ಸ್ಟ್ರೀಮ್ ಆಫ್‌ಲೈನ್ ಆಗಿದೆ.' : 'The stream is currently offline.')
                            }
                        </p>
                    </div>
                </div>

                {/* Live Chat Sidebar - 1/3 width on desktop */}
                {streamSettings?.is_live && chatUrl && (
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-700 h-full">
                            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 flex items-center gap-2">
                                <Signal className="w-5 h-5 animate-pulse" />
                                <h3 className={`font-bold text-lg ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' ? 'ಲೈವ್ ಚಾಟ್' : 'Live Chat'}
                                </h3>
                            </div>
                            <iframe
                                src={chatUrl}
                                title="YouTube Live Chat"
                                frameBorder="0"
                                className="w-full h-[400px] sm:h-[500px] lg:h-[calc(100%-60px)]"
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>

            {/* Broadcast Schedule Section */}
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border-4 border-gray-200 dark:border-gray-700 animate-slide-up-fade">
                <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-8 h-8 text-red-600" />
                    <h2 className={`text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಪ್ರಸಾರ ವೇಳಾಪಟ್ಟಿ' : 'Broadcast Schedule'}
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {broadcastSchedule.map((item, index) => (
                        <div 
                            key={index}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                                item.isLive 
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500 animate-breaking-pulse' 
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            } stagger-${(index % 8) + 1}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {item.day}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                                {item.isLive && (
                                    <Badge className="bg-red-600 text-white animate-pulse">
                                        LIVE
                                    </Badge>
                                )}
                            </div>
                            <p className={`text-red-600 dark:text-red-400 font-semibold mt-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {item.show}
                            </p>
                        </div>
                    ))}
                </div>
                
                <p className={`mt-6 text-center text-sm text-gray-500 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' 
                        ? '* ಸಮಯಗಳು ಬದಲಾಗಬಹುದು. ನವೀಕರಣಗಳಿಗಾಗಿ ಪರಿಶೀಲಿಸಿ.' 
                        : '* Times are subject to change. Check back for updates.'}
                </p>
            </div>
        </div>
    );
}