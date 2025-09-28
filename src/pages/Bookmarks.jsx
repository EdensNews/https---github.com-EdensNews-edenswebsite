import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Article } from '@/api/entities';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ArticleCard from '@/components/news/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkX } from 'lucide-react';

export default function Bookmarks() {
    return (
        <ProtectedRoute>
            <BookmarksContent />
        </ProtectedRoute>
    );
}

function BookmarksContent() {
    const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const fetchBookmarks = async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            if (user && user.bookmarks && user.bookmarks.length > 0) {
                const articles = await Promise.all(
                    user.bookmarks.map(id => Article.get(id).catch(() => null))
                );
                setBookmarkedArticles(articles.filter(Boolean)); // Filter out nulls if an article was deleted
            } else {
                setBookmarkedArticles([]);
            }
        } catch (error) {
            console.error("Failed to fetch bookmarks:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className={`text-3xl font-extrabold text-gray-900 mb-8 ${language === 'kn' ? 'font-kannada' : ''}`}>
                {language === 'kn' ? 'ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು' : 'My Bookmarks'}
            </h1>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            ) : bookmarkedArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bookmarkedArticles.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <BookmarkX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className={`text-xl font-medium text-gray-500 mb-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಯಾವುದೇ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳಿಲ್ಲ' : 'No Bookmarks Found'}
                    </h3>
                    <p className={`text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ನೀವು ಲೇಖನಗಳನ್ನು ಉಳಿಸಿದಾಗ, ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.' : 'When you save articles, they will appear here.'}
                    </p>
                </div>
            )}
        </div>
    );
}