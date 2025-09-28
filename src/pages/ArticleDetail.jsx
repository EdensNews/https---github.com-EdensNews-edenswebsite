
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { bookmarksRepo } from '@/api/repos/bookmarksRepo';
import { useLanguage } from '@/components/LanguageContext';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User as UserIcon, Bookmark, Share2 } from 'lucide-react';
import { format } from 'date-fns';
// toast removed per request

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ArticleDetail() {
    const [article, setArticle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const { user, isLoading: userLoading } = useLanguage();

    const query = useQuery();
    const articleId = query.get('id');
    const { language } = useLanguage();

    useEffect(() => {
        const fetchArticle = async () => {
            if (!articleId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const fetchedArticle = await articlesRepo.get(articleId);
                setArticle(fetchedArticle);
            } catch (error) {
                console.error("Failed to fetch article:", error);
            }
            setIsLoading(false);
        };
        fetchArticle();
    }, [articleId]);

    useEffect(() => {
        const checkBookmark = async () => {
            if (user && article) {
                const b = await bookmarksRepo.isBookmarked(user.id, article.id);
                setIsBookmarked(b);
            }
        };
        checkBookmark();
    }, [user, article]);

    const handleBookmark = async () => {
        if (!user) return;
            try {
                if (isBookmarked) {
                    await bookmarksRepo.remove(user.id, article.id);
                    setIsBookmarked(false);
                } else {
                    setIsBookmarked(true);
                }
            } catch (error) {
                console.error("Failed to update bookmarks", error);
            }
        };
    const handleShare = async () => {
        const title = language === 'kn' ? (article.title_kn || article.title_en) : (article.title_en || article.title_kn);
        // Use consistent URL structure
        const url = `${window.location.origin}/articledetail?id=${articleId}`;
        const shareText = `${title}
${url}

Shared from Edens News`;
        
        // Strategy 1: Try text-only sharing first (this ensures text is always visible)
        if (navigator.share) {
            try {
                await navigator.share({ title, text: shareText, url });
                return;
            } catch { /* user cancelled */ }
        }
        // Final fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };
    
    // (removed unused generateThumbnail helper)
    
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-8" />
                <Skeleton className="w-full h-96 rounded-xl mb-8" />
                <div className="space-y-4 mt-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-5/6" /></div>
            </div>
        );
    }

    if (!article) {
        return <div className="text-center py-20 dark:text-gray-300">Article not found.</div>;
    }

    const title = (() => {
        if (language === 'kn') return article.title_kn || article.title_en || '';
        return article.title_en || article.title_kn || '';
    })();
    const content = language === 'kn' ? (article.content_kn || article.content_en) : (article.content_en || article.content_kn);
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${siteUrl}/articledetail?id=${articleId}`;
    const shareDesc = (content || '').replace(/<[^>]+>/g, '').slice(0, 160) || 'Edens News';
    const shareImage = article.image_url && article.image_url.startsWith('http') ? article.image_url : `${siteUrl}${article.image_url || ''}`;
    // Use Netlify function URL for OG previews when sharing
    const ogShareUrl = `${siteUrl}/.netlify/functions/share-og?id=${article.id}`;
    const waText = encodeURIComponent(`${title}\n\n${ogShareUrl}`);
    const waHref = `https://api.whatsapp.com/send?text=${waText}`;
    
    return (
        <div className="bg-white dark:bg-gray-800">
            <Helmet>
                <title>{`${title} | Edens News`}</title>
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={shareDesc} />
                {shareImage && <meta property="og:image" content={shareImage} />}
                {shareImage && <meta property="og:image:secure_url" content={shareImage} />}
                {shareImage && <meta property="og:image:alt" content={title} />} 
                <meta property="og:site_name" content="Edens News" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={shareDesc} />
                {shareImage && <meta name="twitter:image" content={shareImage} />}
                {shareImage && <meta name="twitter:image:alt" content={title} />}
            </Helmet>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article>
                    <header className="mb-8">
                        {article.category && <Badge className="mb-4">{String(article.category).replace(/\b\w/g, c => c.toUpperCase())}</Badge>}
                        <h1 className={`text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-4 ${language === 'kn' ? 'font-kannada' : ''}`}>{title}</h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 dark:text-gray-400">
                           <div className="flex items-center gap-2"><UserIcon className="w-5 h-5" /><span>{article.reporter || '—'}</span></div>
                           <div className="flex items-center gap-2"><Clock className="w-5 h-5" /><span>{format(new Date(article.created_at || article.created_date), 'MMMM d, yyyy')}</span></div>
                        </div>
                    </header>

                    <img src={article.image_url} alt={title} className="w-full rounded-2xl shadow-lg mb-8" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="%23eeeeee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23777" font-family="Arial" font-size="24">Image not available</text></svg>'; }} />
                    
                    <div className="flex items-center justify-end gap-2 mb-8">
                        <Button variant="outline" onClick={handleBookmark} disabled={userLoading}>
                            <Bookmark className={`w-5 h-5 mr-2 transition-colors ${isBookmarked ? 'text-orange-500 fill-current' : ''}`} />
                            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                        </Button>
                        <Button variant="outline" onClick={handleShare}>
                            <Share2 className="w-5 h-5 mr-2" />
                            Share
                        </Button>
                        <a href={waHref} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">WhatsApp</Button>
                            </a>
                    </div>

                    <div className={`prose prose-lg dark:prose-invert max-w-none ${language === 'kn' ? 'font-kannada' : ''}`} dangerouslySetInnerHTML={{ __html: content }}></div>
                </article>
            </div>
        </div>
    );
}
