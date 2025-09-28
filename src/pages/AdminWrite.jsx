
import React, { useState, useEffect } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { mediaRepo } from '@/api/repos/mediaRepo';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import { articleCategoriesRepo } from '@/api/repos/articleCategoriesRepo';
import { useLanguage } from '@/components/LanguageContext';
import { InvokeLLM } from '@/api/integrations';
import { supabase } from '@/api/supabaseClient';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Languages, Upload, ArrowLeft, Link as LinkIcon, Image, Video, Copy, Plus, Youtube } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';

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
        category: '', reporter: '', image_url: '', is_breaking: false
    });
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
                        content_kn: existingArticle.content_kn || existingArticle.content || '',
                        content_en: existingArticle.content_en || '',
                        reporter: existingArticle.reporter || existingArticle.author || existingArticle.reporter_name || existingArticle.author_name || existingArticle.reported_by || existingArticle.writer || existingArticle.editor || '',
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

    const handleTranslate = async () => {
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
            toast({ title: "Translation completed successfully" });
        } catch (error) {
            console.error('Translation failed:', error);
            toast({ title: "Translation failed. Please try again.", variant: "destructive" });
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
        if (!article.title_kn || !article.content_kn || !article.category || !article.image_url) {
            toast({ title: "Please fill all required fields", variant: "destructive" });
            return;
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
                content_kn: article.content_kn,
                content_en: article.content_en || null,
                reporter: article.reporter || null,
                image_url: article.image_url,
                is_breaking: !!article.is_breaking,
                breaking_expires_at: null,
                status: 'published',
                published_at: nowIso,
            };
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
            // Small delay to let toast auto-dismiss before navigation
            setTimeout(() => navigate(createPageUrl('AdminManage')), 300);
        } catch (error) {
            console.error('Save failed:', error);
            toast({ title: `Failed to ${editId ? 'update' : 'publish'} article`, variant: "destructive", duration: 3000 });
        }
        setIsSaving(false);
    };
    
    // Enhanced Quill modules with comprehensive formatting options
    const quillModules = { 
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': ['sans-serif', 'serif', 'monospace'] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false,
        }
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
                                <div>
                                    <Label className="dark:text-gray-300">{language === 'kn' ? 'ವರದಿಗಾರ' : 'Reporter'}</Label>
                                    <Input 
                                        value={article.reporter} 
                                        onChange={(e) => setArticle({...article, reporter: e.target.value})} 
                                        placeholder="Reporter name" 
                                    />
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
                            <Button 
                                onClick={handleTranslate} 
                                disabled={isTranslating || !article.title_kn || !article.content_kn} 
                                variant="outline"
                            >
                                <Languages className="w-4 h-4 mr-2" />
                                {isTranslating ? 'Translating...' : 'Translate to English'}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="font-kannada dark:text-gray-300">ಶೀರ್ಷಿಕೆ</Label>
                                <Input 
                                    value={article.title_kn} 
                                    onChange={(e) => setArticle({...article, title_kn: e.target.value})} 
                                    placeholder="ಕನ್ನಡ ಶೀರ್ಷಿಕೆ" 
                                    className="font-kannada" 
                                />
                            </div>
                            <div>
                                <Label className="font-kannada dark:text-gray-300">ವಿಷಯ</Label>
                                <ReactQuill 
                                    theme="snow" 
                                    value={article.content_kn} 
                                    onChange={(value) => setArticle({...article, content_kn: value})} 
                                    modules={quillModules} 
                                    className="dark:text-white [&_.ql-editor]:min-h-[300px]" 
                                    placeholder="ಇಲ್ಲಿ ಕನ್ನಡದಲ್ಲಿ ಲೇಖನ ಬರೆಯಿರಿ..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="dark:text-gray-200">English Translation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="dark:text-gray-300">Title</Label>
                                <Input 
                                    value={article.title_en || ''} 
                                    onChange={(e) => setArticle({...article, title_en: e.target.value})} 
                                    placeholder="English title" 
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-300">Content</Label>
                                <ReactQuill 
                                    theme="snow" 
                                    value={article.content_en || ''} 
                                    onChange={(value) => setArticle({...article, content_en: value})} 
                                    modules={quillModules} 
                                    className="dark:text-white [&_.ql-editor]:min-h-[300px]" 
                                    placeholder="Write English article content here..."
                                />
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
