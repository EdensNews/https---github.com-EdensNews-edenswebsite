
import React, { useState, useEffect } from 'react';
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
        <div className="fixed top-14 sm:top-16 lg:top-20 left-0 right-0 z-40 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
            <div className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-1 ${style} font-bold text-sm rounded-r-full relative z-10 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                    <span className={language === 'kn' ? 'font-kannada' : ''}>{text}</span>
                </div>
                {marqueeType === 'breaking' && (
                    <div className="ml-2 px-2 py-0.5 bg-red-700 text-white text-xs font-extrabold rounded animate-pulse">ALERT</div>
                )}
                <div className="flex-1 overflow-hidden">
                    <div className="animate-marquee whitespace-nowrap py-1" style={{ animationDuration: '14s' }}>
                        {marqueeNews.map((article, index) => (
                            <span key={article.id} className="inline-flex items-center gap-4 mr-8">
                                <Link 
                                    to={createPageUrl(`ArticleDetail?id=${article.id}`)}
                                    className={`hover:text-yellow-200 transition-colors ${language === 'kn' ? 'font-kannada' : ''}`}
                                >
                                    {language === 'kn' ? (article.title_kn || article.title_en) : (article.title_en || article.title_kn)}
                                </Link>
                                <div className="flex items-center gap-1 text-red-200 text-xs">
                                    <Clock className="w-3 h-3" />
                                    {(() => {
                                        const raw = article.published_at || article.created_at || article.created_date;
                                        const d = raw ? new Date(raw) : null;
                                        const valid = d && !isNaN(d.getTime());
                                        return <span>{valid ? format(d, 'HH:mm') : ''}</span>;
                                    })()}
                                </div>
                                {index < marqueeNews.length - 1 && (
                                    <span className="text-yellow-400">•</span>
                                )}
                            </span>
                        ))}
                        {/* duplicate list for smoother continuous scroll */}
                        {marqueeNews.map((article, index) => (
                            <span key={`${article.id}-dup`} className="inline-flex items-center gap-4 mr-8">
                                <Link 
                                    to={createPageUrl(`ArticleDetail?id=${article.id}`)}
                                    className={`hover:text-yellow-200 transition-colors ${language === 'kn' ? 'font-kannada' : ''}`}
                                >
                                    {language === 'kn' ? (article.title_kn || article.title_en) : (article.title_en || article.title_kn)}
                                </Link>
                                <div className="flex items-center gap-1 text-red-200 text-xs">
                                    <Clock className="w-3 h-3" />
                                    {(() => {
                                        const raw = article.published_at || article.created_at || article.created_date;
                                        const d = raw ? new Date(raw) : null;
                                        const valid = d && !isNaN(d.getTime());
                                        return <span>{valid ? format(d, 'HH:mm') : ''}</span>;
                                    })()}
                                </div>
                                {index < marqueeNews.length - 1 && (
                                    <span className="text-yellow-400">•</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
