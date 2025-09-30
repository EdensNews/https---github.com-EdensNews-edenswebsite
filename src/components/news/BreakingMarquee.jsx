
import { useState, useEffect } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { useLanguage } from '@/components/LanguageContext';
import { Flame, Clock, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function BreakingMarquee() {
    const [marqueeNews, setMarqueeNews] = useState([]);
    const [marqueeType, setMarqueeType] = useState('breaking'); // 'breaking' or 'latest'
    const { language } = useLanguage();

    // Helper function to get the correct title based on language
    const getTitle = (article) => {
        return language === 'kn' ? (article.title_kn || article.title_en) : (article.title_en || article.title_kn);
    };

    useEffect(() => {
        const fetchMarqueeNews = async () => {
            try {
                // Try to get active breaking news
                const latest = await articlesRepo.list({ limit: 10 });
                const validBreakingNews = (latest || []).filter(article => {
                    if (!article.is_breaking || !article.breaking_expires_at) return false;
                    return new Date(article.breaking_expires_at) > new Date();
                });

                if (validBreakingNews.length > 0) {
                    setMarqueeNews(validBreakingNews.slice(0, 5));
                    setMarqueeType('breaking');
                } else {
                    // If no breaking news, get the latest 5 articles
                    const latestArticles = await articlesRepo.list({ limit: 5 });
                    setMarqueeNews(latestArticles || []);
                    setMarqueeType('latest');
                }
            } catch (error) {
                console.error("Failed to fetch marquee news:", error);
                setMarqueeNews([]);
            }
        };
        
        fetchMarqueeNews();
        const interval = setInterval(fetchMarqueeNews, 5 * 60 * 1000); // Refresh every 5 minutes
        
        return () => clearInterval(interval);
    }, []);

    if (!marqueeNews || marqueeNews.length === 0) return null;

    const MarqueeLabel = () => {
        if (marqueeType === 'breaking') {
            return {
                Icon: Flame,
                text: language === 'kn' ? 'ಬ್ರೇಕಿಂಗ್' : 'BREAKING',
                style: "bg-yellow-500 text-red-900",
                iconClass: "animate-bounce"
            };
        }
        return {
            Icon: Newspaper,
            text: language === 'kn' ? 'ಇತ್ತೀಚಿನ' : 'LATEST',
            style: "bg-blue-500 text-white",
            iconClass: ""
        };
    };

    const { Icon, text, style, iconClass } = MarqueeLabel();

    return (
        <div className="fixed top-14 sm:top-16 lg:top-20 left-0 right-0 z-40 overflow-hidden min-h-[48px]">
            {/* Animated background with multiple layers */}
            <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2 shadow-2xl min-h-[48px]">
                {/* Shiny overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                
                {/* Animated border */}
                <div className="absolute inset-0 border-t-2 border-b-2 border-yellow-400/50"></div>
                
                {/* Moving light effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent animate-shimmer"></div>
                
                <div className="flex items-center relative z-10">
                    {/* Enhanced breaking news label */}
                    <div className={`flex items-center gap-2 px-4 py-1 ${style} font-bold text-sm rounded-r-full relative z-10 flex-shrink-0 shadow-lg`}>
                        <Icon className={`w-4 h-4 ${iconClass}`} />
                        <span className={language === 'kn' ? 'font-kannada' : ''}>{text}</span>
                        {/* Glowing effect for breaking news */}
                        {marqueeType === 'breaking' && (
                            <div className="absolute inset-0 rounded-r-full bg-yellow-400/20 animate-ping"></div>
                        )}
                    </div>
                    
                    {/* Enhanced alert badge */}
                    {marqueeType === 'breaking' && (
                        <div className="ml-2 px-3 py-1 bg-gradient-to-r from-red-700 to-red-600 text-white text-xs font-extrabold rounded-full shadow-lg animate-bounce border border-yellow-400/50">
                            <span className="relative">
                                ALERT
                                <div className="absolute inset-0 bg-yellow-400/30 rounded-full animate-pulse"></div>
                            </span>
                        </div>
                    )}
                    
                    {/* Enhanced marquee content */}
                    <div className="flex-1 overflow-hidden">
                        <div className="animate-marquee whitespace-nowrap py-1" style={{ animationDuration: '14s' }}>
                            {marqueeNews.map((article, index) => (
                                <span key={article.id} className="inline-flex items-center gap-4 mr-8">
                                    <Link 
                                        to={createPageUrl(`ArticleDetail?id=${article.id}`)}
                                        className={`hover:text-yellow-200 transition-all duration-300 hover:scale-105 ${language === 'kn' ? 'font-kannada' : ''} relative group`}
                                    >
                                        <span className="relative z-10">
                                            {getTitle(article)}
                                        </span>
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 bg-yellow-400/20 rounded scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                    </Link>
                                    <div className="flex items-center gap-1 text-red-200 text-xs">
                                        <Clock className="w-3 h-3 animate-pulse" />
                                        {(() => {
                                            const raw = article.published_at || article.created_at || article.created_date;
                                            const d = raw ? new Date(raw) : null;
                                            const valid = d && !isNaN(d.getTime());
                                            return <span>{valid ? format(d, 'HH:mm') : ''}</span>;
                                        })()}
                                    </div>
                                    {index < marqueeNews.length - 1 && (
                                        <span className="text-yellow-400 animate-pulse">•</span>
                                    )}
                                </span>
                            ))}
                            {/* duplicate list for smoother continuous scroll */}
                            {marqueeNews.map((article, index) => (
                                <span key={`${article.id}-dup`} className="inline-flex items-center gap-4 mr-8">
                                    <Link 
                                        to={createPageUrl(`ArticleDetail?id=${article.id}`)}
                                        className={`hover:text-yellow-200 transition-all duration-300 hover:scale-105 ${language === 'kn' ? 'font-kannada' : ''} relative group`}
                                    >
                                        <span className="relative z-10">
                                            {getTitle(article)}
                                        </span>
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 bg-yellow-400/20 rounded scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                    </Link>
                                    <div className="flex items-center gap-1 text-red-200 text-xs">
                                        <Clock className="w-3 h-3 animate-pulse" />
                                        {(() => {
                                            const raw = article.published_at || article.created_at || article.created_date;
                                            const d = raw ? new Date(raw) : null;
                                            const valid = d && !isNaN(d.getTime());
                                            return <span>{valid ? format(d, 'HH:mm') : ''}</span>;
                                        })()}
                                    </div>
                                    {index < marqueeNews.length - 1 && (
                                        <span className="text-yellow-400 animate-pulse">•</span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
