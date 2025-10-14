import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, Eye } from 'lucide-react';

export default function CompactArticleCard({ article }) {
    const { language } = useLanguage();
    
    const title = (() => {
        if (language === 'kn') return article.title_kn || article.title_en || '';
        if (language === 'en') return article.title_en || article.title_kn || '';
        if (language === 'ta') return article.title_ta || article.title_en || article.title_kn || '';
        if (language === 'te') return article.title_te || article.title_en || article.title_kn || '';
        if (language === 'hi') return article.title_hi || article.title_en || article.title_kn || '';
        if (language === 'ml') return article.title_ml || article.title_en || article.title_kn || '';
        return article.title_en || article.title_kn || '';
    })();

    const categoryText = (() => {
        if (!article.category) return '';
        const cat = String(article.category);
        
        // Kannada translations
        if (language === 'kn') {
            const knMap = {
                'Politics': 'ರಾಜಕೀಯ',
                'politics': 'ರಾಜಕೀಯ',
                'Sports': 'ಕ್ರೀಡೆ',
                'sports': 'ಕ್ರೀಡೆ',
                'Business': 'ವ್ಯಾಪಾರ',
                'business': 'ವ್ಯಾಪಾರ',
                'Entertainment': 'ಮನರಂಜನೆ',
                'entertainment': 'ಮನರಂಜನೆ',
                'Technology': 'ತಂತ್ರಜ್ಞಾನ',
                'technology': 'ತಂತ್ರಜ್ಞಾನ',
                'Karnataka': 'ಕರ್ನಾಟಕ',
                'karnataka': 'ಕರ್ನಾಟಕ',
                'World': 'ವಿಶ್ವ',
                'world': 'ವಿಶ್ವ',
                'National': 'ರಾಷ್ಟ್ರೀಯ',
                'national': 'ರಾಷ್ಟ್ರೀಯ'
            };
            return knMap[cat] || cat;
        }
        
        // Tamil translations
        if (language === 'ta') {
            const taMap = {
                'Politics': 'அரசியல்',
                'politics': 'அரசியல்',
                'Sports': 'விளையாட்டு',
                'sports': 'விளையாட்டு',
                'Business': 'வணிகம்',
                'business': 'வணிகம்',
                'Entertainment': 'பொழுதுபோக்கு',
                'entertainment': 'பொழுதுபோக்கு',
                'Technology': 'தொழில்நுட்பம்',
                'technology': 'தொழில்நுட்பம்',
                'Karnataka': 'கர்நாடகா',
                'karnataka': 'கர்நாடகா',
                'World': 'உலகம்',
                'world': 'உலகம்',
                'National': 'தேசிய',
                'national': 'தேசிய'
            };
            return taMap[cat] || cat;
        }
        
        // Telugu translations
        if (language === 'te') {
            const teMap = {
                'Politics': 'రాజకీయాలు',
                'politics': 'రాజకీయాలు',
                'Sports': 'క్రీడలు',
                'sports': 'క్రీడలు',
                'Business': 'వ్యాపారం',
                'business': 'వ్యాపారం',
                'Entertainment': 'వినోదం',
                'entertainment': 'వినోదం',
                'Technology': 'సాంకేతికత',
                'technology': 'సాంకేతికత',
                'Karnataka': 'కర్ణాటక',
                'karnataka': 'కర్ణాటక',
                'World': 'ప్రపంచం',
                'world': 'ప్రపంచం',
                'National': 'జాతీయ',
                'national': 'జాతీయ'
            };
            return teMap[cat] || cat;
        }
        
        // Hindi translations
        if (language === 'hi') {
            const hiMap = {
                'Politics': 'राजनीति',
                'politics': 'राजनीति',
                'Sports': 'खेल',
                'sports': 'खेल',
                'Business': 'व्यापार',
                'business': 'व्यापार',
                'Entertainment': 'मनोरंजन',
                'entertainment': 'मनोरंजन',
                'Technology': 'प्रौद्योगिकी',
                'technology': 'प्रौद्योगिकी',
                'Karnataka': 'कर्नाटक',
                'karnataka': 'कर्नाटक',
                'World': 'विश्व',
                'world': 'विश्व',
                'National': 'राष्ट्रीय',
                'national': 'राष्ट्रीय'
            };
            return hiMap[cat] || cat;
        }
        
        // Malayalam translations
        if (language === 'ml') {
            const mlMap = {
                'Politics': 'രാഷ്ട്രീയം',
                'politics': 'രാഷ്ട്രീയം',
                'Sports': 'കായികം',
                'sports': 'കായികം',
                'Business': 'ബിസിനസ്',
                'business': 'ബിസിനസ്',
                'Entertainment': 'വിനോദം',
                'entertainment': 'വിനോദം',
                'Technology': 'സാങ്കേതികവിദ്യ',
                'technology': 'സാങ്കേതികവിദ്യ',
                'Karnataka': 'കർണാടക',
                'karnataka': 'കർണാടക',
                'World': 'ലോകം',
                'world': 'ലോകം',
                'National': 'ദേശീയ',
                'national': 'ദേശീയ'
            };
            return mlMap[cat] || cat;
        }
        
        return cat.replace(/\b\w/g, c => c.toUpperCase());
    })();

    const categoryColors = {
        Politics: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        Business: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        Entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
        Technology: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        Sports: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        Karnataka: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        World: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    return (
        <Link 
            to={`/articledetail?id=${article.id}`}
            className="group flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                <img 
                    src={article.image_url} 
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {article.views > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" />
                        <span className="text-xs">{article.views}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <Badge className={`${categoryColors[article.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} text-xs mb-1`}>
                    {categoryText}
                </Badge>
                <h3 className={`font-semibold text-sm leading-tight text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 mb-1 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(article.published_at || article.created_at), 'MMM dd, yyyy')}</span>
                </div>
            </div>
        </Link>
    );
}
