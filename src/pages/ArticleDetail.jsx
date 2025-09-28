
import React, { useState, useEffect } from 'react';
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
import { useToast } from "@/components/ui/use-toast";

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
    const { toast } = useToast();

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
        if (!user) {
            toast({ title: "Please login to bookmark articles.", variant: "destructive" });
            return;
        }
        try {
            if (isBookmarked) {
                await bookmarksRepo.remove(user.id, article.id);
                setIsBookmarked(false);
                toast({ title: "Bookmark removed" });
            } else {
                await bookmarksRepo.add(user.id, article.id);
                setIsBookmarked(true);
                toast({ title: "Article bookmarked!" });
            }
        } catch (error) {
            console.error("Failed to update bookmarks", error);
            toast({ title: "Failed to update bookmark.", variant: "destructive" });
        }
    };

    const handleShare = async () => {
        const title = language === 'kn' ? (article.title_kn || article.title_en) : (article.title_en || article.title_kn);
        const url = window.location.href;
        const imageUrl = article.image_url;
        
        // Create a more comprehensive share text that works across platforms
        const shareText = `${title}

${url}

Shared from Edens News`;
        
        // Strategy 1: Try text-only sharing first (this ensures text is always visible)
        if (navigator.share) {
            try {
                await navigator.share({ 
                    title: title,
                    text: shareText,
                    url: url
                });
                toast({ title: "Article shared!" });
                return;
            } catch (err) {
                // User cancelled or other error, continue to file sharing
                console.warn('Text-only share failed:', err);
            }
        }
        
        // Strategy 2: Try sharing with image thumbnail
        if (imageUrl && navigator.canShare && navigator.share) {
            try {
                // Create a thumbnail URL if this is a Supabase storage URL
                let thumbnailUrl = imageUrl;
                
                // Check if this is a Supabase storage URL and create a proper thumbnail transformation
                if (imageUrl.includes('supabase.co/storage/v1/object/public/')) {
                    // Convert the regular URL to a render/image URL with transformation parameters
                    const urlObj = new URL(imageUrl);
                    const bucketAndPath = urlObj.pathname.replace('/storage/v1/object/public/', '');
                    const baseUrl = urlObj.origin;
                    // Create the proper transformation URL
                    thumbnailUrl = `${baseUrl}/storage/v1/render/image/public/${bucketAndPath}?width=400&height=400&resize=cover`;
                }
                
                // Try to fetch the thumbnail
                const res = await fetch(thumbnailUrl, { mode: 'cors' });
                if (res.ok) {
                    const blob = await res.blob();
                    const fileName = (imageUrl.split('/').pop() || 'image').split('?')[0];
                    // Preserve the original file extension
                    const fileExtension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg';
                    const safeName = `thumbnail_${fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName}${fileExtension}`;
                    const file = new File([blob], safeName, { type: blob.type || 'image/jpeg' });
                    
                    const shareData = {
                        title: title,
                        text: shareText,
                        url: url,
                        files: [file]
                    };
                    
                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        toast({ title: "Article shared with thumbnail!" });
                        return;
                    }
                } else {
                    console.warn('Failed to fetch thumbnail, falling back to full image');
                    // If thumbnail fails, try the full image
                    const fullRes = await fetch(imageUrl, { mode: 'cors' });
                    if (fullRes.ok) {
                        const blob = await fullRes.blob();
                        const fileName = (imageUrl.split('/').pop() || 'image').split('?')[0];
                        const fileExtension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg';
                        const safeName = `image_${fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName}${fileExtension}`;
                        const file = new File([blob], safeName, { type: blob.type || 'image/jpeg' });
                        
                        const shareData = {
                            title: title,
                            text: shareText,
                            url: url,
                            files: [file]
                        };
                        
                        if (navigator.canShare(shareData)) {
                            await navigator.share(shareData);
                            toast({ title: "Article shared with image!" });
                            return;
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to share with image:', err);
            }
        }
        
        // Final fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            toast({ title: "Copied to clipboard!" });
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            toast({ title: "Failed to share article", variant: "destructive" });
        }
    };
    
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
    const canonicalUrl = `${siteUrl}/ArticleDetail?id=${article.id}`;
    const shareDesc = (content || '').replace(/<[^>]+>/g, '').slice(0, 160) || 'Edens News';
    const shareImage = article.image_url && article.image_url.startsWith('http') ? article.image_url : `${siteUrl}${article.image_url || ''}`;
    const waText = encodeURIComponent(`${title}\n\n${canonicalUrl}`);
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
