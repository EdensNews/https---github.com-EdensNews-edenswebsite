import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, TrendingUp, Share2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function ArticleCard({ article }) {
    const { language } = useLanguage();
    const { toast } = useToast();
    
    const title = (() => {
        if (language === 'kn') return article.title_kn || article.title_en || '';
        return article.title_en || article.title_kn || '';
    })();
    const categoryText = language === 'kn' ? article.category : article.category;

    // Check if breaking news is still valid (within 1 hour)
    const isBreaking = article.is_breaking && 
        article.breaking_expires_at && 
        new Date(article.breaking_expires_at) > new Date();

    const categoryColors = {
        Politics: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        Crime: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        Technology: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        Entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
        Sports: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        Karnataka: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        World: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    const handleShare = async (e) => {
        // Prevent the link from navigating when sharing
        e.preventDefault();
        e.stopPropagation();
        
        const url = `${window.location.origin}${createPageUrl(`ArticleDetail?id=${article.id}`)}`;
        
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
        
        // Strategy 2: Try sharing with image thumbnail (client-side generation)
        const imageUrl = article.image_url;
        if (imageUrl && navigator.canShare && navigator.share) {
            try {
                // Fetch the full-size image
                const response = await fetch(imageUrl, { mode: 'cors' });
                if (response.ok) {
                    const blob = await response.blob();
                    
                    // Generate thumbnail using HTML5 Canvas
                    const thumbnailBlob = await generateThumbnail(blob, 400, 400);
                    
                    const fileName = (imageUrl.split('/').pop() || 'image').split('?')[0];
                    // Preserve the original file extension
                    const fileExtension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg';
                    const safeName = `thumbnail_${fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName}${fileExtension}`;
                    const file = new File([thumbnailBlob], safeName, { type: thumbnailBlob.type || 'image/jpeg' });
                    
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
                }
            } catch (err) {
                console.warn('Failed to share with thumbnail:', err);
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
    
    // Helper function to generate thumbnail using HTML5 Canvas
    const generateThumbnail = (blob, maxWidth, maxHeight) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate dimensions maintaining aspect ratio
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            };
            
            img.onerror = reject;
            
            // Load image from blob
            img.src = URL.createObjectURL(blob);
        });
    };

    return (
        <div className="block group">
            <Link to={createPageUrl(`ArticleDetail?id=${article.id}`)} className="block">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-2xl dark:shadow-gray-900/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    <div className="relative overflow-hidden">
                        <img 
                            src={article.image_url} 
                            alt={title} 
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {isBreaking && (
                            <Badge className="absolute top-3 right-3 bg-red-600 text-white font-bold animate-pulse shadow-lg">
                                <span className={language === 'kn' ? 'font-kannada' : ''}>
                                    {language === 'kn' ? 'ಬ್ರೇಕಿಂಗ್' : 'BREAKING'}
                                </span>
                            </Badge>
                        )}
                        {article.views > 100 && (
                            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{article.views}</span>
                            </div>
                        )}
                    </div>
                    <div className="p-5 space-y-3 flex-1 flex flex-col">
                        <Badge className={`${categoryColors[article.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} transition-colors w-fit`}>
                            {categoryText}
                        </Badge>
                        <h3 className={`font-bold text-lg leading-snug text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 flex-1 ${language === 'kn' ? 'font-kannada' : ''} line-clamp-3`}>
                            {title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
                            <p className="font-medium truncate flex-1 mr-2">{article.reporter}</p>
                            <div className="flex items-center gap-1 shrink-0">
                               <Clock className="w-4 h-4"/>
                               {(() => {
                                 const raw = article.created_at || article.created_date;
                                 const d = raw ? new Date(raw) : null;
                                 const valid = d && !isNaN(d.getTime());
                                 return <span>{valid ? format(d, 'MMM d, yyyy') : '-'}</span>;
                               })()}
                            </div>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-red-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
            </Link>
            <div className="mt-2 flex justify-end">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </button>
            </div>
        </div>
    );
}