
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';

import { articlesRepo } from '@/api/repos/articlesRepo';
import { bookmarksRepo } from '@/api/repos/bookmarksRepo';
import { analyticsRepo } from '@/api/repos/analyticsRepo';
import { InvokeLLM } from '@/api/llm';
import { useLanguage } from '@/components/LanguageContext';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User as UserIcon, Bookmark, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import ArticleReactions from '@/components/ArticleReactions';
import TextToSpeech from '@/components/TextToSpeech';
// toast removed per request

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ArticleDetail() {
    const [article, setArticle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [hasTrackedView, setHasTrackedView] = useState(false);
    const [readProgress, setReadProgress] = useState(0);
    const { user, isLoading: userLoading } = useLanguage();

    const query = useQuery();
    const articleId = query.get('id');
    const { language } = useLanguage();
    const [translated, setTranslated] = useState({}); // { ta: { title, content }, ... }
    const [isTranslating, setIsTranslating] = useState(false);
    const translateAbortRef = useRef(null);

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

    // Track view when article is loaded and user has spent some time on the page
    useEffect(() => {
        const trackView = async () => {
            if (!hasTrackedView && article && articleId) {
                try {
                    // Wait 3 seconds to ensure user is actually reading the article
                    const timer = setTimeout(async () => {
                        await analyticsRepo.trackView(articleId, user?.id);
                        setHasTrackedView(true);
                        console.log(`Tracked view for article: ${articleId}`);
                    }, 3000);
                    
                    return () => clearTimeout(timer);
                } catch (error) {
                    console.error('Failed to track view:', error);
                }
            }
        };

        trackView();
    }, [article, articleId, hasTrackedView, user?.id]);

    useEffect(() => {
        const checkBookmark = async () => {
            if (user && article) {
                const b = await bookmarksRepo.isBookmarked(user.id, article.id);
                setIsBookmarked(b);
            }
        };
        checkBookmark();
    }, [user, article]);

    // Google Analytics page view tracking
    useEffect(() => {
        // Compute title for GA tracking
        const currentTitle = (() => {
            if (!article) return '';
            if (language === 'kn') return article.title_kn || article.title_en || '';
            if (language === 'en') return article.title_en || article.title_kn || '';
            if (language === 'ta') return article.title_ta || (translated.ta && translated.ta.title) || article.title_en || article.title_kn || '';
            if (language === 'te') return article.title_te || (translated.te && translated.te.title) || article.title_en || article.title_kn || '';
            if (language === 'hi') return article.title_hi || (translated.hi && translated.hi.title) || article.title_en || article.title_kn || '';
            if (language === 'ml') return article.title_ml || (translated.ml && translated.ml.title) || article.title_en || article.title_kn || '';
            const t = translated[language];
            return (t && t.title) || article.title_en || article.title_kn || '';
        })();

        if (typeof window !== 'undefined' && window.gtag && currentTitle) {
            window.gtag('config', 'G-M8C1T8ZMN7', {
                'page_title': `${currentTitle} | Edens News`,
                'page_location': window.location.href,
                'custom_map': {'dimension1': language}
            });
        }
    }, [article, language, translated]);

    // Track article view when article loads
    useEffect(() => {
        // Compute title for GA tracking
        const currentTitle = (() => {
            if (!article) return '';
            if (language === 'kn') return article.title_kn || article.title_en || '';
            if (language === 'en') return article.title_en || article.title_kn || '';
            if (language === 'ta') return article.title_ta || (translated.ta && translated.ta.title) || article.title_en || article.title_kn || '';
            if (language === 'te') return article.title_te || (translated.te && translated.te.title) || article.title_en || article.title_kn || '';
            if (language === 'hi') return article.title_hi || (translated.hi && translated.hi.title) || article.title_en || article.title_kn || '';
            if (language === 'ml') return article.title_ml || (translated.ml && translated.ml.title) || article.title_en || article.title_kn || '';
            const t = translated[language];
            return (t && t.title) || article.title_en || article.title_kn || '';
        })();

        if (article && typeof window !== 'undefined' && window.gtag && currentTitle) {
            window.gtag('event', 'article_view', {
                'article_id': article.id,
                'article_title': currentTitle,
                'article_category': article.category,
                'article_language': language,
                'article_author': article.reporter || 'Unknown'
            });
        }
    }, [article, language, translated]);

    const isStoredLang = (lng) => lng === 'kn' || lng === 'en';

    // On-the-fly translation when selecting non-stored languages (must be before any early returns)
    useEffect(() => {
        const run = async () => {
            if (!article || isStoredLang(language)) return;
            if (translated[language]) return; // cached
            setIsTranslating(true);
            // cancel previous
            if (translateAbortRef.current) translateAbortRef.current.aborted = true;
            const token = { aborted: false };
            translateAbortRef.current = token;
            try {
                const sourceIsEn = !!(article.title_en && article.content_en);
                const srcTitle = sourceIsEn ? (article.title_en || '') : (article.title_kn || '');
                const srcContent = sourceIsEn ? (article.content_en || '') : (article.content_kn || '');
                const targetName = ({ ta: 'Tamil', te: 'Telugu', hi: 'Hindi', ml: 'Malayalam' })[language] || 'Tamil';
                const prompt = `Translate the following ${sourceIsEn ? 'English' : 'Kannada'} news article to ${targetName}. Maintain journalistic style and accuracy. Preserve HTML and formatting, including image tags and embeds. Return strict JSON: {"title": "...", "content": "..."}. Title: ${srcTitle}. Content: ${srcContent}`;
                const result = await InvokeLLM({ prompt, response_json_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } } } });
                if (token.aborted) return;
                setTranslated((prev) => ({ ...prev, [language]: { title: result.title || srcTitle, content: result.content || srcContent } }));
            } catch (e) {
                if (token.aborted) return;
                // cache fallback to source to avoid loops
                setTranslated((prev) => ({ ...prev, [language]: { title: (article.title_en || article.title_kn || ''), content: (article.content_en || article.content_kn || '') } }));
            } finally {
                if (!token.aborted) setIsTranslating(false);
            }
        };
        run();
        // cleanup
        return () => {
            if (translateAbortRef.current) translateAbortRef.current.aborted = true;
        };
    }, [language, article, translated]);

    // Reading Progress Bar
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / totalHeight) * 100;
            setReadProgress(Math.min(progress, 100));
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleBookmark = async () => {
        if (!user) return;

        // Track bookmark attempt
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'bookmark_attempt', {
                'article_id': article.id,
                'article_title': title,
                'current_state': isBookmarked ? 'bookmarked' : 'not_bookmarked'
            });
        }

        try {
            if (isBookmarked) {
                await bookmarksRepo.remove(user.id, article.id);
                setIsBookmarked(false);

                // Track bookmark removal
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'bookmark_removed', {
                        'article_id': article.id,
                        'article_title': title
                    });
                }
            } else {
                setIsBookmarked(true);

                // Track bookmark added
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'bookmark_added', {
                        'article_id': article.id,
                        'article_title': title
                    });
                }
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

        // Track share attempt
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'share_attempt', {
                'article_id': article.id,
                'article_title': title,
                'share_method': 'native_share'
            });
        }

        // Strategy 1: Try text-only sharing first (this ensures text is always visible)
        if (navigator.share) {
            try {
                await navigator.share({ title, text: shareText, url });

                // Track successful share
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'share_success', {
                        'article_id': article.id,
                        'article_title': title,
                        'share_method': 'native_share'
                    });
                }
                return;
            } catch { /* user cancelled */ }
        }
        // Final fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);

            // Track successful copy
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'share_copy', {
                    'article_id': article.id,
                    'article_title': title
                });
            }
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };
    const fbHref = (() => {
        const url = encodeURIComponent(`${window.location.origin}/articledetail?id=${articleId}`);
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    })();
    const twHref = (() => {
        const title = language === 'kn' ? (article?.title_kn || article?.title_en || '') : (article?.title_en || article?.title_kn || '');
        const text = encodeURIComponent(title);
        const url = encodeURIComponent(`${window.location.origin}/articledetail?id=${articleId}`);
        return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    })();
    
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
        if (!article) return '';
        if (language === 'kn') return article.title_kn || article.title_en || '';
        if (language === 'en') return article.title_en || article.title_kn || '';
        if (language === 'ta') return article.title_ta || (translated.ta && translated.ta.title) || article.title_en || article.title_kn || '';
        if (language === 'te') return article.title_te || (translated.te && translated.te.title) || article.title_en || article.title_kn || '';
        if (language === 'hi') return article.title_hi || (translated.hi && translated.hi.title) || article.title_en || article.title_kn || '';
        if (language === 'ml') return article.title_ml || (translated.ml && translated.ml.title) || article.title_en || article.title_kn || '';
        const t = translated[language];
        return (t && t.title) || article.title_en || article.title_kn || '';
    })();
    const content = (() => {
        if (!article) return '';
        if (language === 'kn') return article.content_kn || article.content_en;
        if (language === 'en') return article.content_en || article.content_kn;
        if (language === 'ta') return article.content_ta || (translated.ta && translated.ta.content) || (article.content_en || article.content_kn);
        if (language === 'te') return article.content_te || (translated.te && translated.te.content) || (article.content_en || article.content_kn);
        if (language === 'hi') return article.content_hi || (translated.hi && translated.hi.content) || (article.content_en || article.content_kn);
        if (language === 'ml') return article.content_ml || (translated.ml && translated.ml.content) || (article.content_en || article.content_kn);
        const t = translated[language];
        return (t && t.content) || (article.content_en || article.content_kn);
    })();
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${siteUrl}/articledetail?id=${articleId}`;
    const shareDesc = (content || '').replace(/<[^>]+>/g, '').slice(0, 160) || 'Edens News';
    const shareImage = article.image_url && article.image_url.startsWith('http') ? article.image_url : `${siteUrl}${article.image_url || ''}`;
    // Use Netlify function URL for OG previews when sharing - this provides better caching and ensures images are accessible
    const ogShareUrl = shareImage ? `${siteUrl}/.netlify/functions/share-og?id=${article.id}` : null;
    const waText = encodeURIComponent(`${title}\n\n${ogShareUrl}`);
    const waHref = `https://api.whatsapp.com/send?text=${waText}`;
    
    // (removed duplicate translation effect to maintain stable hook order)

    return (
        <div className="bg-white dark:bg-gray-800 relative z-20">
            {/* Reading Progress Bar - Below Header */}
            <div className="fixed top-[60px] sm:top-[70px] left-0 right-0 h-1 bg-gray-300 dark:bg-gray-700 z-[9999] pointer-events-none shadow-lg">
                <div 
                    className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-150 ease-out"
                    style={{ 
                        width: `${readProgress}%`,
                        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.8), 0 0 30px rgba(220, 38, 38, 0.5)'
                    }}
                />
            </div>
            {/* Debug: Show progress percentage */}
            <div className="fixed top-[65px] sm:top-[75px] right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-[9999] pointer-events-none shadow-lg">
                {Math.round(readProgress)}%
            </div>
            <style>
                {`
                    /* Mobile-only spacing for ArticleDetail to clear header + ticker */
                    @media screen and (max-width: 640px) {
                        .article-detail-wrapper {
                            height: 120px !important;
                            display: block !important;
                        }
                        
                        .article-header-mobile {
                            position: relative !important;
                            z-index: 1 !important;
                        }
                        
                        .article-content-wrapper {
                            position: relative !important;
                            z-index: 1 !important;
                        }
                    }
                `}
            </style>
            <div className="article-detail-wrapper"></div>
            <Helmet>
                <title>{`${title} | Edens News`}</title>
                <link rel="canonical" href={canonicalUrl} />
                <meta name="description" content={shareDesc} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={shareDesc} />
                <meta property="og:site_name" content="Edens News" />
                <meta property="og:locale" content={language === 'kn' ? 'kn_IN' : 'en_IN'} />

                {/* Facebook App ID */}
                {import.meta.env.VITE_FACEBOOK_APP_ID && (
                  <meta property="fb:app_id" content={import.meta.env.VITE_FACEBOOK_APP_ID} />
                )}

                {/* Image meta tags */}
                {ogShareUrl && (
                    <>
                        <meta property="og:image" content={ogShareUrl} />
                        <meta property="og:image:secure_url" content={ogShareUrl} />
                        <meta property="og:image:alt" content={title} />
                        <meta property="og:image:width" content="1200" />
                        <meta property="og:image:height" content="630" />
                        <meta property="og:image:type" content="image/jpeg" />
                    </>
                )}

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@edensnews" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={shareDesc} />
                {ogShareUrl && <meta name="twitter:image" content={ogShareUrl} />}
                {ogShareUrl && <meta name="twitter:image:alt" content={title} />}

                {/* WhatsApp specific meta tags */}
                <meta property="og:image:type" content="image/jpeg" />

                {/* Additional meta tags for better sharing */}
                <meta name="author" content={article.reporter || 'Edens News'} />
                <meta name="keywords" content={`news, ${article.category}, ${language === 'kn' ? 'ಕನ್ನಡ' : 'English'}, Edens News`} />
            </Helmet>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 lg:pt-8 article-content-wrapper">
                <article className="relative z-10 bg-white dark:bg-gray-800">
                    <header className="mb-8 sm:mb-8 article-header-mobile">
                        {article.category && <Badge className="mb-4 sm:mb-4 text-xs sm:text-sm">{String(article.category).replace(/\b\w/g, c => c.toUpperCase())}</Badge>}
                        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-4 sm:mb-4 relative ${language === 'kn' ? 'font-kannada' : ''}`}>{title}</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-x-6 gap-y-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                           <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 sm:w-5 sm:h-5" /><span>{(() => {
                               if (language === 'kn') return article.reporter_kn || article.reporter || '—';
                               if (language === 'en') return article.reporter_en || article.reporter || '—';
                               if (language === 'ta') return article.reporter_ta || article.reporter || '—';
                               if (language === 'te') return article.reporter_te || article.reporter || '—';
                               if (language === 'hi') return article.reporter_hi || article.reporter || '—';
                               if (language === 'ml') return article.reporter_ml || article.reporter || '—';
                               return article.reporter || '—';
                           })()}</span></div>
                           <div className="flex items-center gap-2"><Clock className="w-4 h-4 sm:w-5 sm:h-5" /><span>{(() => { const raw = article.created_at || article.created_date; const d = raw ? new Date(raw) : null; const valid = d && !isNaN(d.getTime()); return valid ? format(d, 'MMMM d, yyyy') : '-'; })()}</span></div>
                        </div>
                    </header>

                    <img src={article.image_url} alt={title} className="w-full rounded-xl sm:rounded-2xl shadow-lg mb-6 sm:mb-6 mt-4" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="%23eeeeee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23777" font-family="Arial" font-size="24">Image not available</text></svg>'; }} />

                    {/* Text-to-Speech */}
                    <TextToSpeech text={content} title={title} />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2 mb-6 sm:mb-8">
                        <Button variant="outline" onClick={handleBookmark} disabled={userLoading} className="w-full sm:w-auto justify-center sm:justify-start">
                            <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-colors ${isBookmarked ? 'text-orange-500 fill-current' : ''}`} />
                            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                        </Button>
                        <Button variant="outline" onClick={handleShare} className="w-full sm:w-auto justify-center sm:justify-start">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Share
                        </Button>
                        <a href={fbHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full">Facebook</Button>
                        </a>
                        <a href={twHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full">Twitter</Button>
                        </a>
                        <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full">WhatsApp</Button>
                        </a>
                    </div>

                    <div className={`prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none ${language === 'kn' ? 'font-kannada' : ''}`} dangerouslySetInnerHTML={{ __html: content }}></div>

                    {/* Article Reactions */}
                    <ArticleReactions articleId={article.id} />

                </article>
            </div>
        </div>
    );
}
