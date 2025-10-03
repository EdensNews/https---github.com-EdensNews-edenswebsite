import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function HeroSection({ article }) {
    const { language } = useLanguage();

    if (!article) return null;

    const title = (() => {
        if (language === 'kn') return article.title_kn || article.title_en || article.title_ta || article.title_te || article.title_hi || article.title_ml || '';
        if (language === 'en') return article.title_en || article.title_kn || article.title_ta || article.title_te || article.title_hi || article.title_ml || '';
        if (language === 'ta') return article.title_ta || article.title_en || article.title_kn || article.title_te || article.title_hi || article.title_ml || '';
        if (language === 'te') return article.title_te || article.title_en || article.title_kn || article.title_ta || article.title_hi || article.title_ml || '';
        if (language === 'hi') return article.title_hi || article.title_en || article.title_kn || article.title_ta || article.title_te || article.title_ml || '';
        if (language === 'ml') return article.title_ml || article.title_en || article.title_kn || article.title_ta || article.title_te || article.title_hi || '';
        return article.title_en || article.title_kn || '';
    })();

    const excerpt = (() => {
        if (language === 'kn') return article.excerpt_kn || article.excerpt_en || '';
        if (language === 'en') return article.excerpt_en || article.excerpt_kn || '';
        if (language === 'ta') return article.excerpt_ta || article.excerpt_en || '';
        if (language === 'te') return article.excerpt_te || article.excerpt_en || '';
        if (language === 'hi') return article.excerpt_hi || article.excerpt_en || '';
        if (language === 'ml') return article.excerpt_ml || article.excerpt_en || '';
        return article.excerpt_en || article.excerpt_kn || '';
    })();

    const categoryColors = {
        Politics: "bg-blue-500 text-white",
        Crime: "bg-red-500 text-white",
        Technology: "bg-indigo-500 text-white",
        Entertainment: "bg-pink-500 text-white",
        Sports: "bg-green-500 text-white",
        Karnataka: "bg-yellow-500 text-white",
        World: "bg-purple-500 text-white",
    };

    return (
        <div className="mb-12 animate-slide-up-fade">
            <Link to={createPageUrl(`ArticleDetail?id=${article.id}`)} className="block group">
                <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Parallax Background Image */}
                    <div className="absolute inset-0 transform transition-transform duration-700 group-hover:scale-105">
                        <img 
                            src={article.image_url} 
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>

                    {/* Shimmer Effect on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12 pt-8 md:pt-10 lg:pt-16 pb-10 md:pb-22 lg:pb-20">
                        {/* Badges Row */}
                        <div className={`flex flex-wrap items-center gap-2 ${language === 'kn' ? 'mb-12 md:mb-16 lg:mb-20' : 'mb-8 md:mb-12 lg:mb-14'}`}>
                            <Badge className="bg-red-600 text-white font-bold px-3 py-1 text-xs md:text-sm animate-breaking-pulse shadow-lg">
                                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 inline" />
                                {language === 'kn' ? 'ವೈಶಿಷ್ಟ್ಯಗೊಳಿಸಲಾಗಿದೆ' : 'FEATURED'}
                            </Badge>
                            <Badge className={`${categoryColors[article.category] || 'bg-gray-600 text-white'} px-3 py-1 text-xs md:text-sm font-semibold`}>
                                {article.category}
                            </Badge>
                            {article.is_breaking && (
                                <Badge className="bg-yellow-500 text-red-900 font-bold px-3 py-1 text-xs md:text-sm animate-pulse">
                                    {language === 'kn' ? 'ಬ್ರೇಕಿಂಗ್' : 'BREAKING'}
                                </Badge>
                            )}
                        </div>

                        {/* Title - Better spacing and sizing for desktop */}
                        <h1 className={`text-3xl sm:text-2xl md:text-3xl lg:text-2xl font-extrabold text-white ${language === 'kn' ? 'mt-0 font-kannada leading-[1.6] whitespace-normal mb-4 md:mb-6 lg:mb-8 line-clamp-2' : 'mt-0 leading-tight mb-3 md:mb-5 line-clamp-2'} break-words group-hover:text-red-400 transition-colors duration-300 drop-shadow-lg`}>
                            {title}
                        </h1>

                        {/* Excerpt */}
                        {excerpt && (
                            <p className={`text-gray-200 text-base md:text-lg lg:text-xl mb-6 line-clamp-2 max-w-4xl ${language === 'kn' ? 'font-kannada leading-relaxed' : ''}`}>
                                {excerpt}
                            </p>
                        )}

                        {/* Meta Info & CTA */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {(() => {
                                        const raw = article.created_at || article.created_date;
                                        const d = raw ? new Date(raw) : null;
                                        const valid = d && !isNaN(d.getTime());
                                        return <span>{valid ? format(d, 'MMM d, yyyy') : '-'}</span>;
                                    })()}
                                </span>
                                {article.views > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {article.views} {language === 'kn' ? 'ವೀಕ್ಷಣೆಗಳು' : 'views'}
                                    </span>
                                )}
                                <span className="font-medium">
                                    {article.reporter}
                                </span>
                            </div>

                            {/* CTA Button */}
                            <Button 
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group/btn"
                                asChild
                            >
                                <span className="flex items-center gap-2">
                                    {language === 'kn' ? 'ಸಂಪೂರ್ಣ ಓದಿ' : 'Read Full Story'}
                                    <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/20 to-transparent rounded-full blur-3xl"></div>
                </div>
            </Link>
        </div>
    );
}
