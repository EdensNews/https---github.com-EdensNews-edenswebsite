import { useState, useEffect, useCallback } from 'react';
import { rssRepo } from '@/api/repos/rssRepo';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import { articleCategoriesRepo } from '@/api/repos/articleCategoriesRepo';
import { fetchRss } from '@/api/functions';
import { InvokeLLM } from '@/api/llm';
import { detectLanguage, getTranslationDirection } from '@/utils/languageDetection';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Play, Pause, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AdminAutoTranslate() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminAutoTranslateContent />
        </ProtectedRoute>
    );
}

function AdminAutoTranslateContent() {
    const [feeds, setFeeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
    const [translationCount, setTranslationCount] = useState(0);
    const [lastRun, setLastRun] = useState(null);
    const [nextRun, setNextRun] = useState(null);
    const [intervalId, setIntervalId] = useState(null);
    
    const { language } = useLanguage();
    const { toast } = useToast();

    const loadFeeds = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedFeeds = await rssRepo.list({ limit: 100 });
            setFeeds(fetchedFeeds);
        } catch (error) {
            console.error('Failed to load feeds:', error);
            toast({ title: "Failed to load RSS feeds", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadFeeds();
    }, [loadFeeds]);

    const extractFirstImageSrc = (html) => {
        if (!html) return '';
        try {
            const match = html.match(/<img[^>]*src=["']([^"'>]+)["'][^>]*>/i);
            return match && match[1] ? match[1] : '';
        } catch (e) {
            return '';
        }
    };

    const copyExternalImageToSupabase = async (imageUrl) => {
        try {
            if (!imageUrl) return '';
            const supaUrl = import.meta.env.VITE_SUPABASE_URL || '';
            const isExternal = !supaUrl || !imageUrl.includes(new URL(supaUrl).host);
            if (!isExternal) return imageUrl;
            const res = await fetch(imageUrl, { mode: 'cors' });
            const blob = await res.blob();
            const bucket = 'media';
            const mime = blob.type || 'image/jpeg';
            const ext = (mime.split('/')[1] || 'jpg').split(';')[0];
            const key = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage.from(bucket).upload(key, blob, {
                contentType: mime,
                cacheControl: '3600',
                upsert: false
            });
            if (upErr) return imageUrl;
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
            return pub?.publicUrl || imageUrl;
        } catch {
            return imageUrl;
        }
    };

    const translateRssArticle = async (rssItem, feed) => {
        try {
            // Use improved language detection
            const titleText = rssItem.title || '';
            const contentText = rssItem.description || rssItem.content || '';
            const combinedText = `${titleText} ${contentText}`;
            
            const translationInfo = getTranslationDirection(combinedText);
            
            if (!translationInfo.needsTranslation) {
                console.warn(`Unable to detect language for article: ${titleText}`);
                return { success: false, error: 'Unable to detect language' };
            }
            
            let articleData;
            
            if (translationInfo.sourceLanguage === 'en') {
                // Translate English to Kannada
                const translationResult = await InvokeLLM({
                    prompt: `Translate the following English news article to Kannada. Maintain journalistic style and accuracy. Preserve any HTML formatting. Title: ${rssItem.title}. Content: ${rssItem.description || rssItem.content || ''}. Provide the translation in this exact JSON format: {"title_kn": "Kannada title", "content_kn": "Kannada content with preserved HTML formatting"}`,
                    response_json_schema: { type: "object", properties: { title_kn: { type: "string" }, content_kn: { type: "string" } } }
                });

                // Create article with both languages, ensure titles populated
                articleData = {
                    title_kn: translationResult.title_kn,
                    title_en: rssItem.title,
                    content_kn: translationResult.content_kn,
                    content_en: rssItem.description || rssItem.content || '',
                    reporter: feed.source_name || feed.name || 'RSS Feed',
                    image_url: rssItem.image_url || rssItem.enclosure?.url || rssItem.media?.thumbnail?.url || extractFirstImageSrc(translationResult.content_kn) || extractFirstImageSrc(rssItem.description || rssItem.content || ''),
                    is_breaking: false,
                    status: 'published',
                    published_at: new Date().toISOString()
                };
                // Fallback if title missing
                if (!articleData.title_kn) articleData.title_kn = rssItem.title || '';
            } else {
                // Translate Kannada to English
                const translationResult = await InvokeLLM({
                    prompt: `Translate the following Kannada news article to English. Maintain journalistic style and accuracy. Preserve any HTML formatting. Title: ${rssItem.title}. Content: ${rssItem.description || rssItem.content || ''}. Provide the translation in this exact JSON format: {"title_en": "English title", "content_en": "English content with preserved HTML formatting"}`,
                    response_json_schema: { type: "object", properties: { title_en: { type: "string" }, content_en: { type: "string" } } }
                });

                // Create article with both languages, ensure titles populated
                articleData = {
                    title_kn: rssItem.title,
                    title_en: translationResult.title_en,
                    content_kn: rssItem.description || rssItem.content || '',
                    content_en: translationResult.content_en,
                    reporter: feed.source_name || feed.name || 'RSS Feed',
                    image_url: rssItem.image_url || rssItem.enclosure?.url || rssItem.media?.thumbnail?.url || extractFirstImageSrc(rssItem.description || rssItem.content || '') || extractFirstImageSrc(translationResult.content_en),
                    is_breaking: false,
                    status: 'published',
                    published_at: new Date().toISOString()
                };
                // Fallback if title missing
                if (!articleData.title_en) articleData.title_en = rssItem.title || '';
            }

            // Ensure image is stored in Supabase if available
            if (articleData.image_url) {
                articleData.image_url = await copyExternalImageToSupabase(articleData.image_url);
            }

            // Create the article
            const savedArticle = await articlesRepo.create(articleData);
            
            if (savedArticle?.id) {
                // Link to RSS category
                try {
                    let rssCategory = await categoriesRepo.getBySlug('rss');
                    if (!rssCategory) {
                        // Create RSS category if it doesn't exist
                        rssCategory = await categoriesRepo.create({
                            name: 'RSS',
                            slug: 'rss'
                        });
                    }
                    
                    if (rssCategory?.id) {
                        await articleCategoriesRepo.link(savedArticle.id, rssCategory.id);
                    }
                } catch (categoryError) {
                    console.warn('Failed to link RSS category:', categoryError);
                }
            }

            return { 
                success: true, 
                direction: translationInfo.direction,
                articleId: savedArticle?.id 
            };
        } catch (error) {
            console.error('Translation failed:', error);
            return { success: false, error: error.message };
        }
    };

    const processFeeds = async () => {
        if (feeds.length === 0) {
            toast({ title: "No RSS feeds available", variant: "destructive" });
            return;
        }

        setIsRunning(true);
        let processedCount = 0;
        let successCount = 0;

        try {
            // Randomly select 1 feed from available feeds
            const randomFeed = feeds[Math.floor(Math.random() * feeds.length)];
            console.log(`Selected random feed: ${randomFeed.source_name || randomFeed.name || 'Unknown Feed'}`);

            try {
                const { data, error } = await fetchRss({ url: randomFeed.url });
                
                if (error || !data?.articles?.length) {
                    console.warn(`No articles found in feed: ${randomFeed.source_name || randomFeed.name || 'Unknown Feed'}`);
                    toast({ title: "No articles found in selected feed", variant: "destructive" });
                    return;
                }

                // Process only 1 article from the selected feed
                const articlesToProcess = data.articles.slice(0, 1);
                
                for (const article of articlesToProcess) {
                    const result = await translateRssArticle(article, randomFeed);
                    
                    processedCount++;
                    if (result.success) {
                        successCount++;
                        console.log(`Translated article from ${randomFeed.source_name || randomFeed.name || 'Unknown Feed'}: ${result.direction} (Article ID: ${result.articleId})`);
                    } else {
                        console.error(`Failed to translate article from ${randomFeed.source_name || randomFeed.name || 'Unknown Feed'}:`, result.error);
                    }
                }
            } catch (feedError) {
                console.error(`Error processing feed ${randomFeed.source_name || randomFeed.name || 'Unknown Feed'}:`, feedError);
            }

            setTranslationCount(prev => prev + successCount);
            setLastRun(new Date());
            
            // Schedule next run in 1 hour
            const nextRunTime = new Date();
            nextRunTime.setHours(nextRunTime.getHours() + 1);
            setNextRun(nextRunTime);

            toast({ 
                title: `Auto-translation completed`, 
                description: `Processed ${processedCount} articles from ${randomFeed.source_name || randomFeed.name || 'Unknown Feed'}, ${successCount} successful translations` 
            });
        } catch (error) {
            console.error('Auto-translation process failed:', error);
            toast({ title: "Auto-translation process failed", variant: "destructive" });
        } finally {
            setIsRunning(false);
        }
    };

    const startAutoTranslation = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        
        // Run immediately
        processFeeds();
        
        // Then run every hour
        const id = setInterval(processFeeds, 60 * 60 * 1000); // 1 hour
        setIntervalId(id);
        setAutoTranslateEnabled(true);
        
        toast({ title: "Auto-translation started", description: "Will run every hour" });
    };

    const stopAutoTranslation = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setAutoTranslateEnabled(false);
        toast({ title: "Auto-translation stopped" });
    };

    const runNow = () => {
        processFeeds();
    };

    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-400" />
                    <h1 className={`text-3xl font-bold text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಸ್ವಯಂಚಾಲಿತ ಅನುವಾದ' : 'Auto Translation'}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Control Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            {language === 'kn' ? 'ನಿಯಂತ್ರಣ ಪ್ಯಾನೆಲ್' : 'Control Panel'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="auto-translate" className="text-sm font-medium">
                                {language === 'kn' ? 'ಸ್ವಯಂಚಾಲಿತ ಅನುವಾದ' : 'Auto Translation'}
                            </Label>
                            <Switch
                                id="auto-translate"
                                checked={autoTranslateEnabled}
                                onCheckedChange={autoTranslateEnabled ? stopAutoTranslation : startAutoTranslation}
                                disabled={isRunning}
                            />
                        </div>

                        <div className="space-y-4">
                            <Button 
                                onClick={runNow} 
                                disabled={isRunning || feeds.length === 0}
                                className="w-full"
                            >
                                {isRunning ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        {language === 'kn' ? 'ಸಂಸ್ಕರಿಸುತ್ತಿದೆ...' : 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        {language === 'kn' ? 'ಈಗ ಚಲಾಯಿಸಿ' : 'Run Now'}
                                    </>
                                )}
                            </Button>

                            {autoTranslateEnabled && (
                                <Button 
                                    onClick={stopAutoTranslation}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Pause className="w-4 h-4 mr-2" />
                                    {language === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {language === 'kn' ? 'ಅಂಕಿಅಂಶಗಳು' : 'Statistics'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                {language === 'kn' ? 'ಒಟ್ಟು ಅನುವಾದಗಳು' : 'Total Translations'}
                            </span>
                            <Badge variant="secondary" className="text-lg px-3 py-1">
                                {translationCount}
                            </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                {language === 'kn' ? 'ಕೊನೆಯ ರನ್' : 'Last Run'}
                            </span>
                            <span className="text-sm">
                                {lastRun ? lastRun.toLocaleString() : 'Never'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                {language === 'kn' ? 'ಮುಂದಿನ ರನ್' : 'Next Run'}
                            </span>
                            <span className="text-sm">
                                {nextRun ? nextRun.toLocaleString() : 'Not scheduled'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                {language === 'kn' ? 'RSS ಫೀಡ್‌ಗಳು' : 'RSS Feeds'}
                            </span>
                            <Badge variant="outline">
                                {feeds.length}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RSS Feeds List */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>
                        {language === 'kn' ? 'RSS ಫೀಡ್‌ಗಳು' : 'RSS Feeds'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">
                                {language === 'kn' ? 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading...'}
                            </p>
                        </div>
                    ) : feeds.length > 0 ? (
                        <div className="space-y-3">
                            {feeds.map((feed) => (
                                <div key={feed.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">{feed.source_name || feed.name || 'Unknown Feed'}</h3>
                                        <p className="text-sm text-gray-400">{feed.url}</p>
                                    </div>
                                    <Badge variant="outline">
                                        {language === 'kn' ? 'ಸಕ್ರಿಯ' : 'Active'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>
                                {language === 'kn' 
                                    ? 'ಯಾವುದೇ RSS ಫೀಡ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ' 
                                    : 'No RSS feeds found'
                                }
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
