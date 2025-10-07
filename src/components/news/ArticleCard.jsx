import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, TrendingUp, Share2, Eye } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useState } from 'react';

export default function ArticleCard({ article }) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const [viewCount] = useState(article.views || 0);
    
    const title = (() => {
        // Prefer exact language match, then sensible fallbacks
        if (language === 'kn') return article.title_kn || article.title_en || article.title_ta || article.title_te || article.title_hi || article.title_ml || '';
        if (language === 'en') return article.title_en || article.title_kn || article.title_ta || article.title_te || article.title_hi || article.title_ml || '';
        if (language === 'ta') return article.title_ta || article.title_en || article.title_kn || article.title_te || article.title_hi || article.title_ml || '';
        if (language === 'te') return article.title_te || article.title_en || article.title_kn || article.title_ta || article.title_hi || article.title_ml || '';
        if (language === 'hi') return article.title_hi || article.title_en || article.title_kn || article.title_ta || article.title_te || article.title_ml || '';
        if (language === 'ml') return article.title_ml || article.title_en || article.title_kn || article.title_ta || article.title_te || article.title_hi || '';
        return article.title_en || article.title_kn || '';
    })();
    const categoryText = language === 'kn' ? (article.category_kn || article.category) : article.category;

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
        
        // Use the article URL for sharing
        const shareUrl = `${window.location.origin}/articledetail?id=${article.id}`;
        
        // Create a more comprehensive share text that works across platforms
        const shareText = `${title}

${shareUrl}

Shared from Edens News`;
        
        // Strategy 1: Try sharing with the appropriate URL
        if (navigator.share) {
            try {
                await navigator.share({ 
                    title: title,
                    text: shareText,
                    url: shareUrl
                });
                const message = isLocalhost ? "Article shared!" : "Article shared with preview!";
                toast({ title: message, duration: 3000 });
                return;
            } catch (err) {
                // User cancelled or other error, continue to other strategies
                console.warn('Share failed:', err);
            }
        }
        
        // Strategy 2: Try sharing with image thumbnail (client-side generation)
        const imageUrl = article.image_url;
        if (imageUrl && navigator.canShare && navigator.share) {
            try {
                // First try to fetch the image with CORS
                let response;
                try {
                    response = await fetch(imageUrl, { 
                        mode: 'cors',
                        credentials: 'omit'
                    });
                } catch (corsError) {
                    console.warn('CORS fetch failed, trying no-cors approach:', corsError);
                    // Try using no-cors mode
                    response = await fetch(imageUrl, { 
                        mode: 'no-cors'
                    });
                }
                
                if (response && response.ok) {
                    const blob = await response.blob();
                    
                    // Check if blob is valid
                    if (blob.size > 0) {
                        // Generate smaller thumbnail for better compatibility (300x300, compressed)
                        const thumbnailBlob = await generateThumbnail(blob, 300, 300);
                        
                        if (thumbnailBlob) {
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
                                toast({ title: "Article shared with thumbnail!", duration: 3000 });
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to share with thumbnail:', err);
            }
        }
        
        // Final fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareText);
            toast({ title: "Copied to clipboard!", duration: 3000 });
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            toast({ title: "Failed to share article", variant: "destructive", duration: 5000 });
        }
    };
    
    // Helper function to generate thumbnail using HTML5 Canvas
    const generateThumbnail = (blob, maxWidth, maxHeight) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS for images
            
            img.onload = () => {
                try {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        reject(new Error('Canvas context not available'));
                        return;
                    }
                    
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
                    canvas.height = height;
                    
                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert canvas to blob with lower quality for smaller file size
                    canvas.toBlob((blob) => {
                        if (blob) {
                            // Check if blob is under 5MB (WhatsApp/Facebook limit)
                            if (blob.size > 5 * 1024 * 1024) {
                                // Try again with lower quality
                                canvas.toBlob((smallerBlob) => {
                                    resolve(smallerBlob || blob);
                                }, 'image/jpeg', 0.4); // 40% quality for very large images
                            } else {
                                resolve(blob);
                            }
                        } else {
                            reject(new Error('Failed to create thumbnail blob'));
                        }
                    }, 'image/jpeg', 0.6); // 60% quality JPEG (reduced from 70%)
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = (error) => {
                reject(new Error('Failed to load image for thumbnail generation'));
            };
            
            // Load image from blob
            const objectUrl = URL.createObjectURL(blob);
            img.src = objectUrl;
            
            // Clean up object URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(objectUrl);
            }, 10000);
        });
    };

    return (
        <div className="block group animate-slide-up-fade hover-float">
            <Link to={createPageUrl(`ArticleDetail?id=${article.id}`)} className="block">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-2xl dark:shadow-gray-900/30 transition-elastic transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100 dark:border-gray-700 h-full flex flex-col relative shimmer-effect">
                    <div className="relative overflow-hidden transform-3d">
                        <img 
                            src={article.image_url} 
                            alt={title} 
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {/* Extremely subtle shimmer overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-2000"></div>
                        {isBreaking && (
                            <Badge className="absolute top-3 right-3 bg-red-600 text-white font-bold animate-breaking-pulse shadow-lg" style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)' }}>
                                <span className={`${language === 'kn' ? 'font-kannada' : ''}`} style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.3)' }}>
                                    {language === 'kn' ? 'ಬ್ರೇಕಿಂಗ್' : 'BREAKING'}
                                </span>
                                {/* Subtle sparkle effects */}
                                <div className="sparkle" style={{ top: '-5px', right: '-5px', animationDelay: '0s', opacity: '0.5' }}></div>
                                <div className="sparkle" style={{ bottom: '-5px', left: '-5px', animationDelay: '0.7s', opacity: '0.5' }}></div>
                            </Badge>
                        )}
                        {viewCount > 0 && (
                            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 glass-effect animate-zoom-in">
                                <Eye className="w-3 h-3 animate-pulse" style={{ animationDuration: '3s' }} />
                                <span className="font-semibold">{viewCount}</span>
                            </div>
                        )}
                    </div>
                    <div className="p-5 space-y-3 flex-1 flex flex-col">
                        <Badge className={`${categoryColors[article.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} transition-bounce w-fit hover:scale-110`}>
                            {categoryText}
                        </Badge>
                        <h3 className={`font-bold text-lg leading-snug text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-smooth flex-1 ${language === 'kn' ? 'font-kannada' : ''} line-clamp-3 ${isBreaking ? 'animate-breaking-flash' : ''}`} style={isBreaking ? { animationDuration: '3s' } : {}}>
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
                    <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left gradient-animate"></div>
                </div>
            </Link>
            <div className="mt-2 flex justify-end">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-bounce hover:scale-110 ripple-effect"
                >
                    <Share2 className="w-4 h-4 hover-wiggle" />
                    <span>Share</span>
                </button>
            </div>
        </div>
    );
}