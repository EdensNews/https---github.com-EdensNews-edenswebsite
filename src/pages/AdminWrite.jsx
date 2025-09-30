
import { useState, useEffect } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { mediaRepo } from '@/api/repos/mediaRepo';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import { articleCategoriesRepo } from '@/api/repos/articleCategoriesRepo';
import { useLanguage } from '@/components/LanguageContext';
import { InvokeLLM } from '@/api/llm';
import { detectLanguage, getTranslationDirection } from '@/utils/languageDetection';
import { supabase } from '@/api/supabaseClient';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Languages, Upload, ArrowLeft, Link as LinkIcon, Image, Video, Copy, Plus, Youtube } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import QuillEditor from '@/components/ui/QuillEditor';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function AdminWrite() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminWriteContent />
        </ProtectedRoute>
    );
}

function AdminWriteContent() {
    const [article, setArticle] = useState({
        title_kn: '', title_en: '', content_kn: '', content_en: '',
        title_ta: '', title_te: '', title_hi: '', title_ml: '',
        content_ta: '', content_te: '', content_hi: '', content_ml: '',
        reporter_kn: '', reporter_en: '', reporter_ta: '', reporter_te: '', reporter_hi: '', reporter_ml: '',
        category: '', reporter: '', image_url: '', is_breaking: false
    });
    const [translated, setTranslated] = useState({ en: null, ta: null, te: null, hi: null, ml: null });
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageInputType, setImageInputType] = useState('upload');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [videoUrlInput, setVideoUrlInput] = useState('');
    
    const { language } = useLanguage();
    const { toast } = useToast();
    const query = useQuery();
    const navigate = useNavigate();
    const editId = query.get('editId');
    const location = useLocation();
    const rssItem = location.state?.rssItem;

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const categoriesPromise = categoriesRepo.list();
                const mediaItemsPromise = mediaRepo.list({ limit: 100 });

                const [cats, items] = await Promise.all([categoriesPromise, mediaItemsPromise]);

                if (editId) {
                    const existingArticle = await articlesRepo.get(editId);
                    if (!existingArticle || !existingArticle.id) {
                        throw new Error('Article not found');
                    }

            const normalized = {
                        ...existingArticle,
                        title_kn: existingArticle.title_kn || existingArticle.title || existingArticle.headline || '',
                        title_en: existingArticle.title_en || '',
                title_ta: existingArticle.title_ta || '',
                title_te: existingArticle.title_te || '',
                title_hi: existingArticle.title_hi || '',
                title_ml: existingArticle.title_ml || '',
                        content_kn: existingArticle.content_kn || existingArticle.content || '',
                        content_en: existingArticle.content_en || '',
                content_ta: existingArticle.content_ta || '',
                content_te: existingArticle.content_te || '',
                content_hi: existingArticle.content_hi || '',
                content_ml: existingArticle.content_ml || '',
                        reporter: existingArticle.reporter || existingArticle.author || existingArticle.reporter_name || existingArticle.author_name || existingArticle.reported_by || existingArticle.writer || existingArticle.editor || '',
                        reporter_kn: existingArticle.reporter_kn || '',
                        reporter_en: existingArticle.reporter_en || '',
                        reporter_ta: existingArticle.reporter_ta || '',
                        reporter_te: existingArticle.reporter_te || '',
                        reporter_hi: existingArticle.reporter_hi || '',
                        reporter_ml: existingArticle.reporter_ml || '',
                        image_url: existingArticle.image_url || existingArticle.image || existingArticle.thumbnail_url || existingArticle.cover_image || '',
                    };

                    const joins = await articleCategoriesRepo.listForArticles([existingArticle.id]);
                    const first = joins && joins.length ? joins[0] : null;
                    let catSlug = first?.categories?.slug || '';
                    if (!catSlug && existingArticle.category) {
                        catSlug = String(existingArticle.category).toLowerCase();
                    }

                    setArticle({ ...normalized, category: catSlug });

                    if (normalized.image_url) {
                        setImageUrlInput(normalized.image_url);
                        setImageInputType('link');
                    }
                } else if (rssItem) {
                    // Handle RSS item import
            const rssArticle = {
                        title_kn: rssItem.title || '',
                        title_en: '', // Will be translated if needed
                title_ta: '', title_te: '', title_hi: '', title_ml: '',
                        content_kn: rssItem.description || '',
                        content_en: '', // Will be translated if needed
                content_ta: '', content_te: '', content_hi: '', content_ml: '',
                        reporter: 'RSS Import',
                        image_url: rssItem.image_url || rssItem.enclosure?.url || rssItem.media?.thumbnail?.url || '',
                        category: 'rss', // RSS category
                        is_breaking: false
                    };

                    setArticle(rssArticle);

                    if (rssArticle.image_url) {
                        setImageUrlInput(rssArticle.image_url);
                        setImageInputType('link');
                    }

                    // Auto-translate RSS content based on detected language
                    if (rssItem.title && rssItem.description) {
                        try {
                            const titleText = rssItem.title || '';
                            const contentText = rssItem.description || '';
                            const combinedText = `${titleText} ${contentText}`;
                            
                            const translationInfo = getTranslationDirection(combinedText);
                            
                            if (translationInfo.needsTranslation) {
                                if (translationInfo.sourceLanguage === 'en') {
                                    // Translate English to Kannada
                                    const translationResult = await InvokeLLM({
                                        prompt: `Translate the following English news article to Kannada. Maintain journalistic style and accuracy. Preserve any HTML formatting. Title: ${rssItem.title}. Content: ${rssItem.description || ''}. Provide the translation in this exact JSON format: {"title_kn": "Kannada title", "content_kn": "Kannada content with preserved HTML formatting"}`,
                                        response_json_schema: { type: "object", properties: { title_kn: { type: "string" }, content_kn: { type: "string" } } }
                                    });
                                    setArticle(prev => ({ 
                                        ...prev, 
                                        title_kn: translationResult.title_kn || rssItem.title || prev.title_kn, 
                                        content_kn: translationResult.content_kn,
                                        title_en: rssItem.title || prev.title_en,
                                        content_en: rssItem.description || prev.content_en || ''
                                    }));
                                    toast({ title: `RSS article imported and translated (${translationInfo.direction})` });
                                } else {
                                    // Translate Kannada to English
                                    const translationResult = await InvokeLLM({
                                        prompt: `Translate the following Kannada news article to English. Maintain journalistic style and accuracy. Preserve any HTML formatting. Title: ${rssItem.title}. Content: ${rssItem.description || ''}. Provide the translation in this exact JSON format: {"title_en": "English title", "content_en": "English content with preserved HTML formatting"}`,
                                        response_json_schema: { type: "object", properties: { title_en: { type: "string" }, content_en: { type: "string" } } }
                                    });
                                    setArticle(prev => ({ 
                                        ...prev, 
                                        title_kn: rssItem.title || prev.title_kn, 
                                        content_kn: rssItem.description || prev.content_kn || '',
                                        title_en: translationResult.title_en || prev.title_en,
                                        content_en: translationResult.content_en
                                    }));
                                    toast({ title: `RSS article imported and translated (${translationInfo.direction})` });
                                }
                            } else {
                                // No translation detected, but try to translate anyway if content looks like English
                                const titleText = rssItem.title || '';
                                const contentText = rssItem.description || '';
                                
                                // If title contains English words, assume it's English and translate to Kannada
                                if (titleText.match(/[A-Za-z]/)) {
                                    try {
                                        const translationResult = await InvokeLLM({
                                            prompt: `Translate the following English news article to Kannada. Maintain journalistic style and accuracy. Preserve any HTML formatting. Title: ${rssItem.title}. Content: ${rssItem.description || ''}. Provide the translation in this exact JSON format: {"title_kn": "Kannada title", "content_kn": "Kannada content with preserved HTML formatting"}`,
                                            response_json_schema: { type: "object", properties: { title_kn: { type: "string" }, content_kn: { type: "string" } } }
                                        });
                                        setArticle(prev => ({ 
                                            ...prev, 
                                            title_kn: translationResult.title_kn, 
                                            content_kn: translationResult.content_kn,
                                            title_en: rssItem.title, // Keep original English
                                            content_en: rssItem.description || ''
                                        }));
                                        toast({ title: "RSS article imported and translated (EN → KN)" });
                                    } catch (translationError) {
                                        console.error('Fallback translation failed:', translationError);
                                        // Import as-is if translation fails
                                        setArticle(prev => ({ 
                                            ...prev, 
                                            title_en: rssItem.title,
                                            content_en: rssItem.description || ''
                                        }));
                                        toast({ title: "RSS article imported (translation failed)" });
                                    }
                                } else {
                                    // No translation needed, just import as-is
                                    setArticle(prev => ({ 
                                        ...prev, 
                                        title_en: rssItem.title,
                                        content_en: rssItem.description || ''
                                    }));
                                    toast({ title: "RSS article imported (no translation needed)" });
                                }
                            }
                        } catch (error) {
                            console.error('Auto-translation failed:', error);
                            // Keep original content if translation fails
                            setArticle(prev => ({ 
                                ...prev, 
                                title_en: rssItem.title,
                                content_en: rssItem.description || ''
                            }));
                            toast({ title: "RSS article imported (translation failed)", variant: "destructive" });
                        }
                    }
                }

                setCategoryOptions(cats || []);
                setMediaItems(items || []);

            } catch (error) {
                console.error("Failed to load initial data:", error);
                if (error.message === 'Article not found') {
                    toast({ title: "Article not found", variant: "destructive", duration: 2500 });
                    navigate(createPageUrl('AdminManage'));
                } else {
                    toast({ title: "Error loading data", variant: "destructive" });
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [editId, rssItem, navigate, toast]);

    if (isLoading) {
        return <div className="flex flex-col items-center justify-center h-full">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-b-2 rounded-full" role="status">
                <span className="sr-only">Loading...</span>
            </div>
        </div>;
    }

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            let videoId = null;
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
        return null;
    };

    const handleTranslateToEnglish = async () => {
        if (!article.title_kn || !article.content_kn) {
            toast({ title: "Please enter Kannada title and content first", variant: "destructive" });
            return;
        }
        setIsTranslating(true);
        try {
            const translationResult = await InvokeLLM({
                prompt: `Translate the following Kannada news article to English. Maintain journalistic style and accuracy. Preserve any HTML formatting, image tags, and video embeds. Title: ${article.title_kn}. Content: ${article.content_kn}. Provide the translation in this exact JSON format: {"title_en": "English title", "content_en": "English content with preserved HTML formatting"}`,
                response_json_schema: { type: "object", properties: { title_en: { type: "string" }, content_en: { type: "string" } } }
            });
            setArticle(prev => ({ ...prev, title_en: translationResult.title_en, content_en: translationResult.content_en }));
            setTranslated(prev => ({ ...prev, en: { title: translationResult.title_en, content: translationResult.content_en } }));
            toast({ title: "Translation to English completed successfully" });
        } catch (error) {
            console.error('Translation failed:', error);
            toast({ title: "Translation failed. Please try again.", variant: "destructive" });
        }
        setIsTranslating(false);
    };

    const handleTranslateToKannada = async () => {
        if (!article.title_en || !article.content_en) {
            toast({ title: "Please enter English title and content first", variant: "destructive" });
            return;
        }
        setIsTranslating(true);
        try {
            const translationResult = await InvokeLLM({
                prompt: `Translate the following English news article to Kannada. Maintain journalistic style and accuracy. Preserve any HTML formatting, image tags, and video embeds. Title: ${article.title_en}. Content: ${article.content_en}. Provide the translation in this exact JSON format: {"title_kn": "Kannada title", "content_kn": "Kannada content with preserved HTML formatting"}`,
                response_json_schema: { type: "object", properties: { title_kn: { type: "string" }, content_kn: { type: "string" } } }
            });
            setArticle(prev => ({ ...prev, title_kn: translationResult.title_kn, content_kn: translationResult.content_kn }));
            toast({ title: "Translation to Kannada completed successfully" });
        } catch (error) {
            console.error('Translation failed:', error);
            toast({ title: "Translation failed. Please try again.", variant: "destructive" });
        }
        setIsTranslating(false);
    };

    // Title-only translators
    const handleTranslateTitleToEnglish = async () => {
        if (!article.title_kn) {
            toast({ title: "Enter Kannada title first", variant: "destructive" });
            return;
        }
        setIsTranslating(true);
        try {
            const res = await InvokeLLM({
                prompt: `Translate ONLY the following Kannada news headline to English. Return strict JSON: {"title_en":"..."}. Title: ${article.title_kn}`,
                response_json_schema: { type: 'object', properties: { title_en: { type: 'string' } } }
            });
            setArticle(prev => ({ ...prev, title_en: res.title_en || prev.title_en || '' }));
            toast({ title: "Title translated to English" });
        } catch (e) {
            console.error('Title translation failed:', e);
            toast({ title: "Failed to translate title", variant: 'destructive' });
        }
        setIsTranslating(false);
    };

    const handleTranslateTitleToKannada = async () => {
        if (!article.title_en) {
            toast({ title: "Enter English title first", variant: "destructive" });
            return;
        }
        setIsTranslating(true);
        try {
            const res = await InvokeLLM({
                prompt: `Translate ONLY the following English news headline to Kannada. Return strict JSON: {"title_kn":"..."}. Title: ${article.title_en}`,
                response_json_schema: { type: 'object', properties: { title_kn: { type: 'string' } } }
            });
            setArticle(prev => ({ ...prev, title_kn: res.title_kn || prev.title_kn || '' }));
            toast({ title: "Title translated to Kannada" });
        } catch (e) {
            console.error('Title translation failed:', e);
            toast({ title: "Failed to translate title", variant: 'destructive' });
        }
        setIsTranslating(false);
    };

    const translateTitleToTarget = async (target) => {
        const names = { ta: 'Tamil', te: 'Telugu', hi: 'Hindi', ml: 'Malayalam' };
        const targetName = names[target] || 'Tamil';
        const hasEnglish = !!article.title_en;
        const sourceTitle = hasEnglish ? article.title_en : article.title_kn;
        if (!sourceTitle) {
            toast({ title: hasEnglish ? 'Enter English title first' : 'Enter Kannada title first', variant: 'destructive' });
            return;
        }
        setIsTranslating(true);
        try {
            const res = await InvokeLLM({
                prompt: `Translate ONLY the following ${hasEnglish ? 'English' : 'Kannada'} news headline to ${targetName}. Return strict JSON: {"title":"..."}. Title: ${sourceTitle}`,
                response_json_schema: { type: 'object', properties: { title: { type: 'string' } } }
            });
            setArticle(prev => ({ ...prev, [`title_${target}`]: res.title || prev[`title_${target}`] || '' }));
            toast({ title: `Title translated to ${targetName}` });
        } catch (e) {
            console.error('Title translation failed:', e);
            toast({ title: `Failed to translate title to ${targetName}`, variant: 'destructive' });
        }
        setIsTranslating(false);
    };

    const translateToTarget = async (target, { suppressSpinner = false } = {}) => {
        const map = { ta: 'Tamil', te: 'Telugu', hi: 'Hindi', ml: 'Malayalam' };
        const targetName = map[target] || 'Tamil';
        const hasEnglish = !!(article.title_en && article.content_en);
        const srcTitle = hasEnglish ? article.title_en : article.title_kn;
        const srcContent = hasEnglish ? article.content_en : article.content_kn;
        if (!srcTitle || !srcContent) {
            toast({ title: hasEnglish ? "Please enter English title and content first" : "Please enter Kannada title and content first", variant: "destructive" });
            return;
        }
        if (!suppressSpinner) setIsTranslating(true);
        try {
            const prompt = `Translate the following ${hasEnglish ? 'English' : 'Kannada'} news article to ${targetName}. Maintain journalistic style and accuracy. Preserve HTML formatting, image tags, and video embeds.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no other text:
{"title": "Translated title here", "content": "Translated content with HTML here"}

CRITICAL: In the JSON, make sure to properly escape any quotes within the content field by using backslashes. For example: "content": "He said \\"Hello World\\""

Title: ${srcTitle}
Content: ${srcContent}`;
            const result = await InvokeLLM({
                prompt,
                response_json_schema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } } }
            });
            setTranslated(prev => ({ ...prev, [target]: { title: result.title, content: result.content } }));
            // Persist into article fields so it saves
            setArticle(prev => ({
                ...prev,
                [`title_${target}`]: result.title,
                [`content_${target}`]: result.content
            }));
            toast({ title: `Translated to ${targetName}` });
        } catch (e) {
            console.error('Translation failed:', e);
            toast({ title: `Failed to translate to ${targetName}`, variant: 'destructive' });
        }
        if (!suppressSpinner) setIsTranslating(false);
    };

    const translateAll = async () => {
        setIsTranslating(true);
        // Ensure English exists if source is Kannada
        try {
            if (!article.title_en || !article.content_en) {
                if (article.title_kn && article.content_kn) {
                    const resEn = await InvokeLLM({
                        prompt: `Translate the following Kannada news article to English. Maintain journalistic style and accuracy. Preserve HTML formatting.

IMPORTANT: Respond with ONLY valid JSON in this exact format: {"title_en": "English title", "content_en": "English content with HTML"}

CRITICAL: Properly escape quotes in content: "content_en": "He said \\"Hello\\""

Title: ${article.title_kn}
Content: ${article.content_kn}`,
                        response_json_schema: { type: 'object', properties: { title_en: { type: 'string' }, content_en: { type: 'string' } } }
                    });
                    setArticle(prev => ({ ...prev, title_en: resEn.title_en, content_en: resEn.content_en }));
                }
            }
        } catch (e) {
            console.warn('English translation skipped:', e);
        }
        const targets = ['ta','te','hi','ml'];
        for (const t of targets) {
            // eslint-disable-next-line no-await-in-loop
            await translateToTarget(t, { suppressSpinner: true });
        }
        setIsTranslating(false);
    };

    const handleImageUpload = async (file) => {
        setIsUploadingImage(true);
        try {
            const bucket = 'media'; // Ensure this bucket exists and is public in Supabase
            const ext = file.name.split('.').pop();
            const key = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || 'jpg'}`;
            const { error: upErr } = await supabase.storage.from(bucket).upload(key, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (upErr) throw upErr;
            const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
            const publicUrl = pub?.publicUrl;
            if (!publicUrl) throw new Error('No public URL returned');
            setArticle(prev => ({ ...prev, image_url: publicUrl }));
            setImageUrlInput(publicUrl);
            toast({ title: "Image uploaded to Supabase" });
        } catch (error) {
            console.error('Image upload failed:', error);
            toast({ title: "Failed to upload image", variant: "destructive" });
        }
        setIsUploadingImage(false);
    };

    const handleImageUrlSubmit = () => {
        if (imageUrlInput.trim()) {
            setArticle(prev => ({ ...prev, image_url: imageUrlInput.trim() }));
            toast({ title: "Image URL added successfully" });
        }
    };

    const insertVideoIntoContent = (videoUrl, contentField) => {
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        let videoHtml = '';
        
        if (embedUrl) {
            // YouTube embed
            videoHtml = `<div class="video-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe></div>`;
        } else if (videoUrl.trim()) {
            // Direct video link
            videoHtml = `<video controls style="width: 100%; max-width: 600px; height: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><source src="${videoUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
        } else {
            toast({ title: "Please enter a valid video URL.", variant: "destructive" });
            return;
        }

        const currentContent = article[contentField] || '';
        setArticle(prev => ({
            ...prev,
            [contentField]: currentContent + videoHtml
        }));
        
        toast({ title: "Video embedded successfully!" });
        setVideoUrlInput('');
    };

    const insertMediaIntoContent = (mediaItem, contentField) => {
        let mediaHtml = '';
        
        if (mediaItem.file_type === 'video') {
            const embedUrl = getYouTubeEmbedUrl(mediaItem.file_url);
            if (embedUrl) {
                mediaHtml = `<div class="video-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe></div>`;
            } else {
                mediaHtml = `<video controls style="width: 100%; max-width: 600px; height: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><source src="${mediaItem.file_url}" type="video/mp4">Your browser does not support the video tag.</video>`;
            }
        } else {
            mediaHtml = `<img src="${mediaItem.file_url}" alt="${mediaItem.name}" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" />`;
        }

        const currentContent = article[contentField] || '';
        setArticle(prev => ({
            ...prev,
            [contentField]: currentContent + mediaHtml
        }));
        
        toast({ title: `${mediaItem.file_type === 'video' ? 'Video' : 'Image'} inserted into content` });
    };

    const handleSave = async () => {
        // Enforce Kannada headline/content as baseline
        if (!article.title_kn || !article.content_kn || !article.category || !article.image_url) {
            toast({ title: "Please fill all required fields (Kannada headline, content, category, image)", variant: "destructive" });
            return;
        }

        // Ensure English headline exists; auto-translate if missing
        try {
            if (!article.title_en || !article.content_en) {
                const translationResult = await InvokeLLM({
                    prompt: `Translate the following Kannada news article to English. Maintain journalistic style and accuracy. Preserve any HTML formatting, image tags, and video embeds.

IMPORTANT: Respond with ONLY valid JSON: {"title_en": "English title", "content_en": "English content"}

CRITICAL: Properly escape quotes in content: "content_en": "He said \\"Hello\\""

Title: ${article.title_kn}. Content: ${article.content_kn}`,
                    response_json_schema: { type: "object", properties: { title_en: { type: "string" }, content_en: { type: "string" } } }
                });
                setArticle(prev => ({ ...prev, title_en: prev.title_en || translationResult.title_en || '', content_en: prev.content_en || translationResult.content_en || '' }));
            }
        } catch (autoEnErr) {
            console.warn('Auto English translation skipped:', autoEnErr?.message || autoEnErr);
        }

        // Validate that for any filled non-stored language content, the headline is present
        const nonStored = [
            { code: 'ta', title: article.title_ta, content: article.content_ta },
            { code: 'te', title: article.title_te, content: article.content_te },
            { code: 'hi', title: article.title_hi, content: article.content_hi },
            { code: 'ml', title: article.title_ml, content: article.content_ml },
        ];
        for (const lang of nonStored) {
            if ((lang.content && !lang.title) || (lang.title && !lang.content)) {
                toast({ title: `Please complete both title and content for ${lang.code.toUpperCase()}`, variant: 'destructive' });
                return;
            }
        }
        setIsSaving(true);
        try {
            // If image_url is external and not already in this Supabase project, copy it to Supabase Storage
            try {
                const supaUrl = import.meta.env.VITE_SUPABASE_URL || '';
                const isExternal = article.image_url && (!supaUrl || !article.image_url.includes(new URL(supaUrl).host));
                if (isExternal) {
                    const res = await fetch(article.image_url, { mode: 'cors' });
                    const blob = await res.blob();
                    const bucket = 'media';
                    const mime = blob.type || 'image/jpeg';
                    const ext = mime.split('/')[1] || 'jpg';
                    const key = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error: upErr } = await supabase.storage.from(bucket).upload(key, blob, {
                        contentType: mime,
                        cacheControl: '3600',
                        upsert: false
                    });
                    if (!upErr) {
                        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(key);
                        const publicUrl = pub?.publicUrl;
                        if (publicUrl) {
                            article.image_url = publicUrl;
                        }
                    }
                }
            } catch (imgCopyErr) {
                console.warn('Image copy to Supabase skipped:', imgCopyErr?.message || imgCopyErr);
            }
            // Build payload ONLY with columns that exist in Supabase 'articles' table
            const nowIso = new Date().toISOString();
            const payload = {
                title_kn: article.title_kn,
                title_en: article.title_en || null,
                title_ta: article.title_ta || null,
                title_te: article.title_te || null,
                title_hi: article.title_hi || null,
                title_ml: article.title_ml || null,
                content_kn: article.content_kn,
                content_en: article.content_en || null,
                content_ta: article.content_ta || null,
                content_te: article.content_te || null,
                content_hi: article.content_hi || null,
                content_ml: article.content_ml || null,
                reporter: article.reporter || null,
                reporter_kn: article.reporter_kn || null,
                reporter_en: article.reporter_en || null,
                reporter_ta: article.reporter_ta || null,
                reporter_te: article.reporter_te || null,
                reporter_hi: article.reporter_hi || null,
                reporter_ml: article.reporter_ml || null,
                image_url: article.image_url,
                is_breaking: !!article.is_breaking,
                breaking_expires_at: null,
                status: 'published',
                published_at: nowIso,
            };

            // Add RSS tracking fields if this is an RSS import
            if (rssItem) {
                payload.is_rss_import = true;
                payload.rss_source_url = rssItem.link || '';
                payload.rss_article_id = rssItem.id || rssItem.guid || rssItem.link;
                payload.rss_guid = rssItem.guid || null;
                payload.rss_link = rssItem.link || '';
                payload.rss_pub_date = rssItem.pubDate ? new Date(rssItem.pubDate).toISOString() : null;
            }
            // Set breaking news expiration to 1 hour from now if breaking news is enabled
            if (article.is_breaking) {
                const expirationTime = new Date();
                expirationTime.setHours(expirationTime.getHours() + 1);
                payload.breaking_expires_at = expirationTime.toISOString();
            }

            let saved = null;
            if (editId) {
                saved = await articlesRepo.update(editId, payload);
                toast({ title: "Article updated successfully", duration: 2000 });
            } else {
                saved = await articlesRepo.create(payload);
                toast({ title: "Article published successfully", duration: 2000 });
            }

            // Link category to the article via article_categories
            try {
                const selected = (article.category || '').toString();
                const slug = selected.toLowerCase();
                if (slug && saved?.id) {
                    const cat = await categoriesRepo.getBySlug(slug);
                    if (cat?.id) {
                        await articleCategoriesRepo.link(saved.id, cat.id);
                    }
                }
            } catch (e) {
                console.warn('Category link skipped:', e?.message || e);
            }

            // Mark RSS article as processed if this was an RSS import
            if (rssItem && saved?.id) {
                try {
                    const feedId = rssItem.feedId || null;
                    if (feedId) {
                        console.log(`Marking RSS article as processed: ${rssItem.title}`);
                        await rssRepo.markArticleAsProcessed(feedId, rssItem, saved.id);
                        
                        // Show success message for RSS import
                        toast({ 
                            title: "RSS Article Imported Successfully!", 
                            description: "This article has been translated and saved. It will not appear in future RSS fetches.",
                            duration: 4000
                        });
                    }
                } catch (rssError) {
                    console.warn('Failed to mark RSS article as processed:', rssError);
                    // Don't fail the save operation if RSS tracking fails
                }
            }

            // Small delay to let toast auto-dismiss before navigation
            setTimeout(() => navigate(createPageUrl('AdminManage')), 300);
        } catch (error) {
            console.error('Save failed:', error);
            toast({ title: `Failed to ${editId ? 'update' : 'publish'} article`, variant: "destructive", duration: 3000 });
        }
        setIsSaving(false);
    };
    

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={createPageUrl(editId ? 'AdminManage' : 'Admin')}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className={`text-2xl sm:text-3xl font-bold dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {editId 
                        ? (language === 'kn' ? 'ಲೇಖನ ಸಂಪಾದಿಸಿ' : 'Edit Article') 
                        : (language === 'kn' ? 'ಹೊಸ ಲೇಖನ ಬರೆಯಿರಿ' : 'Write New Article')
                    }
                </h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="xl:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="dark:text-gray-200">
                                {language === 'kn' ? 'ಮೂಲ ವಿವರಗಳು' : 'Basic Details'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="dark:text-gray-300">{language === 'kn' ? 'ವರ್ಗ' : 'Category'}</Label>
                                    <Select value={(article.category ?? '').toString()} onValueChange={(value) => setArticle({...article, category: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryOptions.map((cat) => (
                                                <SelectItem key={cat.id} value={(cat.slug || '').toString()}>
                                                    {cat.name || cat.slug}
                                                </SelectItem>
                                            ))}
                                            {(() => {
                                                const current = (article.category ?? '').toString();
                                                const exists = categoryOptions.some(c => (c.slug || '').toString() === current);
                                                return (!exists && current) ? (
                                                    <SelectItem key={`__current_${current}`} value={current}>
                                                        {current}
                                                    </SelectItem>
                                                ) : null;
                                            })()}
                                        </SelectContent>
                                    </Select>
                                    {categoryOptions.length === 0 && (
                                        <p className={`text-xs text-yellow-500 mt-1 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                            {language === 'kn' ? 'ವರ್ಗಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಆಡ್ಮಿನ್ → ಕ್ಯಾಟಗರೀಸ್‌ನಲ್ಲಿ ಸೇರಿಸಿ.' : 'No categories found. Add some in Admin → Categories.'}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <Label className="dark:text-gray-300 text-lg font-semibold">{language === 'kn' ? 'ವರದಿಗಾರ ಹೆಸರು (ಎಲ್ಲಾ ಭಾಷೆಗಳಲ್ಲಿ)' : 'Reporter Name (All Languages)'}</Label>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="dark:text-gray-300 text-sm">Kannada (ಕನ್ನಡ)</Label>
                                            <Input 
                                                value={article.reporter_kn} 
                                                onChange={(e) => setArticle({...article, reporter_kn: e.target.value})} 
                                                placeholder="ವರದಿಗಾರ ಹೆಸರು" 
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="dark:text-gray-300 text-sm">English</Label>
                                            <Input 
                                                value={article.reporter_en} 
                                                onChange={(e) => setArticle({...article, reporter_en: e.target.value})} 
                                                placeholder="Reporter name" 
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="dark:text-gray-300 text-sm">Tamil (தமிழ்)</Label>
                                            <Input 
                                                value={article.reporter_ta} 
                                                onChange={(e) => setArticle({...article, reporter_ta: e.target.value})} 
                                                placeholder="செய்தியாளர் பெயர்" 
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="dark:text-gray-300 text-sm">Telugu (తెలుగు)</Label>
                                            <Input 
                                                value={article.reporter_te} 
                                                onChange={(e) => setArticle({...article, reporter_te: e.target.value})} 
                                                placeholder="రిపోర్టర్ పేరు" 
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="dark:text-gray-300 text-sm">Hindi (हिंदी)</Label>
                                            <Input 
                                                value={article.reporter_hi} 
                                                onChange={(e) => setArticle({...article, reporter_hi: e.target.value})} 
                                                placeholder="रिपोर्टर का नाम" 
                                            />
                                        </div>
                                        
                                        <div>
                                            <Label className="dark:text-gray-300 text-sm">Malayalam (മലയാളം)</Label>
                                            <Input 
                                                value={article.reporter_ml} 
                                                onChange={(e) => setArticle({...article, reporter_ml: e.target.value})} 
                                                placeholder="റിപ്പോർട്ടർ പേര്" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <Label className="dark:text-gray-300 text-sm">{language === 'kn' ? 'ಡೀಫಾಲ್ಟ್ ವರದಿಗಾರ (ಹಳೆಯ ಕ್ಷೇತ್ರ)' : 'Default Reporter (Legacy Field)'}</Label>
                                        <Input 
                                            value={article.reporter} 
                                            onChange={(e) => setArticle({...article, reporter: e.target.value})} 
                                            placeholder="Reporter name" 
                                            className="opacity-60"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    checked={article.is_breaking} 
                                    onCheckedChange={(checked) => setArticle({...article, is_breaking: checked})} 
                                />
                                <Label className="dark:text-gray-300">
                                    {language === 'kn' ? 'ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್ (1 ಗಂಟೆ)' : 'Breaking News (1 hour)'}
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="dark:text-gray-200">
                                {language === 'kn' ? 'ಮುಖ್ಯ ಚಿತ್ರ' : 'Main Article Image'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={imageInputType} onValueChange={setImageInputType}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload
                                    </TabsTrigger>
                                    <TabsTrigger value="link">
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        URL
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="upload" className="space-y-4">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => { 
                                            const file = e.target.files[0]; 
                                            if (file) handleImageUpload(file); 
                                        }} 
                                        className="hidden" 
                                        id="image-upload" 
                                    />
                                    <Label htmlFor="image-upload">
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-orange-500 dark:hover:border-orange-400 cursor-pointer">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="dark:text-gray-300">
                                                {isUploadingImage ? 'Uploading...' : 'Click to select image'}
                                            </p>
                                        </div>
                                    </Label>
                                </TabsContent>
                                
                                <TabsContent value="link" className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            value={imageUrlInput}
                                            onChange={(e) => setImageUrlInput(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            type="url"
                                        />
                                        <Button onClick={handleImageUrlSubmit} variant="outline">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                            
                            {article.image_url && (
                                <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mt-4" />
                            )}
                        </CardContent>
                    </Card>

                    {/* Video Embedding Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="dark:text-gray-200 flex items-center gap-2">
                                <Youtube className="w-5 h-5" />
                                {language === 'kn' ? 'ವೀಡಿಯೊ ಎಂಬೆಡ್ ಮಾಡಿ' : 'Embed Video'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={videoUrlInput}
                                    onChange={(e) => setVideoUrlInput(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                                    type="url"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => insertVideoIntoContent(videoUrlInput, 'content_kn')}
                                    disabled={!videoUrlInput.trim()}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Youtube className="w-4 h-4 mr-2" />
                                    {language === 'kn' ? 'ಕನ್ನಡ ಲೇಖನದಲ್ಲಿ ಸೇರಿಸಿ' : 'Add to Kannada'}
                                </Button>
                                <Button
                                    onClick={() => insertVideoIntoContent(videoUrlInput, 'content_en')}
                                    disabled={!videoUrlInput.trim()}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Youtube className="w-4 h-4 mr-2" />
                                    {language === 'kn' ? 'ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸೇರಿಸಿ' : 'Add to English'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="font-kannada dark:text-gray-200">ಕನ್ನಡ ವಿಷಯ</CardTitle>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleTranslateToEnglish} 
                                    disabled={isTranslating || !article.title_kn || !article.content_kn} 
                                    variant="outline"
                                    size="sm"
                                >
                                    <Languages className="w-4 h-4 mr-2" />
                                    {isTranslating ? 'Translating...' : 'To English'}
                                </Button>
                                <Button 
                                    onClick={() => translateToTarget('ta')} 
                                    disabled={isTranslating || !(article.title_kn && article.content_kn) && !(article.title_en && article.content_en)} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {isTranslating ? '...' : 'To Tamil'}
                                </Button>
                                <Button 
                                    onClick={() => translateToTarget('te')} 
                                    disabled={isTranslating || !(article.title_kn && article.content_kn) && !(article.title_en && article.content_en)} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {isTranslating ? '...' : 'To Telugu'}
                                </Button>
                                <Button 
                                    onClick={() => translateToTarget('hi')} 
                                    disabled={isTranslating || !(article.title_kn && article.content_kn) && !(article.title_en && article.content_en)} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {isTranslating ? '...' : 'To Hindi'}
                                </Button>
                                <Button 
                                    onClick={() => translateToTarget('ml')} 
                                    disabled={isTranslating || !(article.title_kn && article.content_kn) && !(article.title_en && article.content_en)} 
                                    variant="outline"
                                    size="sm"
                                >
                                    {isTranslating ? '...' : 'To Malayalam'}
                                </Button>
                                <Button 
                                    onClick={translateAll}
                                    disabled={isTranslating || (!article.title_kn && !article.title_en)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                    size="sm"
                                >
                                    {isTranslating ? 'Translating…' : 'Translate All'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="font-kannada dark:text-gray-300">ಶೀರ್ಷಿಕೆ</Label>
                                    <Button size="sm" variant="outline" onClick={handleTranslateTitleToEnglish} disabled={isTranslating || !article.title_kn}>Title → EN</Button>
                                </div>
                                <Input 
                                    value={article.title_kn} 
                                    onChange={(e) => setArticle({...article, title_kn: e.target.value})} 
                                    placeholder="ಕನ್ನಡ ಶೀರ್ಷಿಕೆ" 
                                    className="font-kannada" 
                                />
                            </div>
                            <div>
                                <Label className="font-kannada dark:text-gray-300">ವಿಷಯ</Label>
                                <QuillEditor 
                                    value={article.content_kn} 
                                    onChange={(value) => setArticle({ ...article, content_kn: value })} 
                                    className="dark:text-white" 
                                    placeholder="ಇಲ್ಲಿ ಕನ್ನಡದಲ್ಲಿ ಲೇಖನ ಬರೆಯಿರಿ..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="dark:text-gray-200">English Translation</CardTitle>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleTranslateToKannada} 
                                    disabled={isTranslating || !article.title_en || !article.content_en} 
                                    variant="outline"
                                    size="sm"
                                >
                                    <Languages className="w-4 h-4 mr-2" />
                                    {isTranslating ? 'Translating...' : 'To Kannada'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="dark:text-gray-300">Title</Label>
                                    <Button size="sm" variant="outline" onClick={handleTranslateTitleToKannada} disabled={isTranslating || !article.title_en}>Title → KN</Button>
                                </div>
                                <Input 
                                    value={article.title_en || ''} 
                                    onChange={(e) => setArticle({...article, title_en: e.target.value})} 
                                    placeholder="English title" 
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-300">Content</Label>
                                <QuillEditor 
                                    value={article.content_en || ''} 
                                    onChange={(value) => setArticle({ ...article, content_en: value })} 
                                    className="dark:text-white" 
                                    placeholder="Write English article content here..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Languages */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="dark:text-gray-200">Other Languages</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Tamil */}
                            <div className="space-y-3">
                                <Label className="dark:text-gray-300">Tamil Title</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={article.title_ta}
                                        onChange={(e) => setArticle({ ...article, title_ta: e.target.value })}
                                        placeholder="Tamil title"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => translateTitleToTarget('ta')} disabled={isTranslating}>↻</Button>
                                </div>
                                <Label className="dark:text-gray-300">Tamil Content</Label>
                                <QuillEditor 
                                    value={article.content_ta}
                                    onChange={(value) => setArticle({ ...article, content_ta: value })}
                                    className="dark:text-white"
                                    placeholder="Write Tamil article content here..."
                                />
                                <div><Button size="sm" variant="outline" onClick={() => translateToTarget('ta')}>Update Tamil via Translate</Button></div>
                            </div>

                            {/* Telugu */}
                            <div className="space-y-3">
                                <Label className="dark:text-gray-300">Telugu Title</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={article.title_te}
                                        onChange={(e) => setArticle({ ...article, title_te: e.target.value })}
                                        placeholder="Telugu title"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => translateTitleToTarget('te')} disabled={isTranslating}>↻</Button>
                                </div>
                                <Label className="dark:text-gray-300">Telugu Content</Label>
                                <QuillEditor 
                                    value={article.content_te}
                                    onChange={(value) => setArticle({ ...article, content_te: value })}
                                    className="dark:text-white"
                                    placeholder="Write Telugu article content here..."
                                />
                                <div><Button size="sm" variant="outline" onClick={() => translateToTarget('te')}>Update Telugu via Translate</Button></div>
                            </div>

                            {/* Hindi */}
                            <div className="space-y-3">
                                <Label className="dark:text-gray-300">Hindi Title</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={article.title_hi}
                                        onChange={(e) => setArticle({ ...article, title_hi: e.target.value })}
                                        placeholder="Hindi title"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => translateTitleToTarget('hi')} disabled={isTranslating}>↻</Button>
                                </div>
                                <Label className="dark:text-gray-300">Hindi Content</Label>
                                <QuillEditor 
                                    value={article.content_hi}
                                    onChange={(value) => setArticle({ ...article, content_hi: value })}
                                    className="dark:text-white"
                                    placeholder="Write Hindi article content here..."
                                />
                                <div><Button size="sm" variant="outline" onClick={() => translateToTarget('hi')}>Update Hindi via Translate</Button></div>
                            </div>

                            {/* Malayalam */}
                            <div className="space-y-3">
                                <Label className="dark:text-gray-300">Malayalam Title</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={article.title_ml}
                                        onChange={(e) => setArticle({ ...article, title_ml: e.target.value })}
                                        placeholder="Malayalam title"
                                    />
                                    <Button size="sm" variant="outline" onClick={() => translateTitleToTarget('ml')} disabled={isTranslating}>↻</Button>
                                </div>
                                <Label className="dark:text-gray-300">Malayalam Content</Label>
                                <QuillEditor 
                                    value={article.content_ml}
                                    onChange={(value) => setArticle({ ...article, content_ml: value })}
                                    className="dark:text-white"
                                    placeholder="Write Malayalam article content here..."
                                />
                                <div><Button size="sm" variant="outline" onClick={() => translateToTarget('ml')}>Update Malayalam via Translate</Button></div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving 
                                ? (editId ? 'Updating...' : 'Publishing...') 
                                : (editId ? 'Update Article' : 'Publish Article')
                            }
                        </Button>
                    </div>
                </div>

                {/* Media Sidebar */}
                <div className="xl:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className={`text-lg dark:text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಮೀಡಿಯಾ ಲೈಬ್ರರಿ' : 'Media Library'}
                            </CardTitle>
                            <p className={`text-sm text-gray-500 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' 
                                    ? 'ಚಿತ್ರಗಳು ಮತ್ತು ವೀಡಿಯೊಗಳನ್ನು ಲೇಖನದಲ್ಲಿ ಸೇರಿಸಿ' 
                                    : 'Insert images and videos into your article'
                                }
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                            {mediaItems.map((item) => (
                                <div key={item.id} className="border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        {item.file_type === 'video' ? (
                                            <Video className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            <Image className="w-4 h-4 text-green-500" />
                                        )}
                                        <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                                    </div>
                                    
                                    {item.file_type === 'image' ? (
                                        <img 
                                            src={item.file_url} 
                                            alt={item.name}
                                            className="w-full h-16 object-cover rounded mb-2"
                                        />
                                    ) : (
                                        <div className="w-full h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center mb-2">
                                            <Video className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => insertMediaIntoContent(item, 'content_kn')}
                                            className="flex-1 text-xs font-kannada"
                                        >
                                            ಕನ್ನಡಕ್ಕೆ +
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => insertMediaIntoContent(item, 'content_en')}
                                            className="flex-1 text-xs"
                                        >
                                            EN +
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.file_url);
                                                toast({ title: "URL copied!" });
                                            }}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            
                            {mediaItems.length === 0 && (
                                <p className={`text-center text-gray-500 dark:text-gray-400 py-8 text-sm ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' 
                                        ? 'ಯಾವುದೇ ಮೀಡಿಯಾ ಐಟಂಗಳಿಲ್ಲ' 
                                        : 'No media items found'
                                    }
                                </p>
                            )}
                            
                            <Link to={createPageUrl('AdminMedia')}>
                                <Button variant="outline" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {language === 'kn' ? 'ಮೀಡಿಯಾ ಸೇರಿಸಿ' : 'Add Media'}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
