import React, { useState, useEffect } from 'react';
import { mediaRepo } from '@/api/repos/mediaRepo';
import { UploadFile } from '@/api/integrations';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Link as LinkIcon, ArrowLeft, Image, Video, Copy, Trash2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminMedia() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminMediaContent />
        </ProtectedRoute>
    );
}

function AdminMediaContent() {
    const [mediaItems, setMediaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [linkForm, setLinkForm] = useState({ name: '', file_url: '', file_type: 'image' });
    
    const { language } = useLanguage();
    const { toast } = useToast();

    const loadMediaItems = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const items = await mediaRepo.list({ limit: 200 });
            setMediaItems(items);
        } catch (error) {
            console.error('Failed to load media items:', error);
            toast({ title: "Failed to load media items", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadMediaItems();
    }, [loadMediaItems]);

    const handleFileUpload = async (file) => {
        setIsUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            const fileType = file.type.startsWith('image/') ? 'image' : 
                           file.type.startsWith('video/') ? 'video' : 'document';
            
            await mediaRepo.create({
                name: file.name,
                file_url: file_url,
                file_type: fileType
            });
            
            toast({ title: "File uploaded successfully!" });
            loadMediaItems();
        } catch (error) {
            console.error('Upload failed:', error);
            toast({ title: "Failed to upload file", variant: "destructive" });
        }
        setIsUploading(false);
    };

    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        if (!linkForm.name || !linkForm.file_url) {
            toast({ title: "Please fill all fields", variant: "destructive" });
            return;
        }

        try {
            await mediaRepo.create(linkForm);
            toast({ title: "Media link added successfully!" });
            setLinkForm({ name: '', file_url: '', file_type: 'image' });
            loadMediaItems();
        } catch (error) {
            console.error('Failed to add media link:', error);
            toast({ title: "Failed to add media link", variant: "destructive" });
        }
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        toast({ title: "URL copied to clipboard!" });
    };

    const deleteMediaItem = async (id) => {
        if (confirm('Are you sure you want to delete this media item?')) {
            try {
                await mediaRepo.remove(id);
                toast({ title: "Media item deleted successfully!" });
                loadMediaItems();
            } catch (error) {
                console.error('Failed to delete media item:', error);
                toast({ title: "Failed to delete media item", variant: "destructive" });
            }
        }
    };

    const getYouTubeEmbedUrl = (url) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                const videoId = urlObj.hostname.includes('youtu.be') 
                    ? urlObj.pathname.slice(1)
                    : urlObj.searchParams.get('v');
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }
        } catch {
            // Not a valid URL or not YouTube
        }
        return null;
    };

    const renderMediaPreview = (item) => {
        if (item.file_type === 'video') {
            const youtubeEmbed = getYouTubeEmbedUrl(item.file_url);
            if (youtubeEmbed) {
                return (
                    <iframe
                        src={youtubeEmbed}
                        className="w-full h-32 rounded"
                        frameBorder="0"
                        allowFullScreen
                        title={item.name}
                    />
                );
            } else {
                return (
                    <video 
                        src={item.file_url} 
                        className="w-full h-32 object-cover rounded"
                        controls
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                );
            }
        } else {
            return (
                <img 
                    src={item.file_url} 
                    alt={item.name}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                    }}
                />
            );
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <h1 className={`text-3xl font-bold text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? 'ಮೀಡಿಯಾ ಲೈಬ್ರರಿ' : 'Media Library'}
                </h1>
            </div>

            <Tabs defaultValue="upload" className="mb-8">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className={language === 'kn' ? 'font-kannada' : ''}>
                        {language === 'kn' ? 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload Files'}
                    </TabsTrigger>
                    <TabsTrigger value="link" className={language === 'kn' ? 'font-kannada' : ''}>
                        {language === 'kn' ? 'ಲಿಂಕ್ ಸೇರಿಸಿ' : 'Add by Link'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle className={`dark:text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಫೈಲ್ ಅಪ್‌ಲೋಡ್' : 'Upload Files'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    files.forEach(handleFileUpload);
                                }}
                                className="hidden"
                                id="file-upload"
                            />
                            <Label htmlFor="file-upload">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-orange-500 dark:hover:border-orange-400 cursor-pointer">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className={`text-lg font-medium dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {isUploading 
                                            ? (language === 'kn' ? 'ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Uploading...') 
                                            : (language === 'kn' ? 'ಫೈಲ್‌ಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ' : 'Click to select files')
                                        }
                                    </p>
                                    <p className={`text-sm text-gray-500 dark:text-gray-400 mt-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ಚಿತ್ರಗಳು ಮತ್ತು ವೀಡಿಯೊಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ' : 'Supports images and videos'}
                                    </p>
                                </div>
                            </Label>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="link">
                    <Card>
                        <CardHeader>
                            <CardTitle className={`dark:text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಲಿಂಕ್‌ನಿಂದ ಮೀಡಿಯಾ ಸೇರಿಸಿ' : 'Add Media by Link'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <LinkIcon className="h-4 w-4" />
                                <AlertDescription className={language === 'kn' ? 'font-kannada' : ''}>
                                    {language === 'kn' 
                                        ? 'YouTube, Google Drive, Dropbox ಅಥವಾ ಇತರ ಕ್ಲೌಡ್ ಸ್ಟೋರೇಜ್‌ನಿಂದ ಲಿಂಕ್‌ಗಳನ್ನು ಸೇರಿಸಿ'
                                        : 'Add links from YouTube, Google Drive, Dropbox, or other cloud storage services'
                                    }
                                </AlertDescription>
                            </Alert>
                            <form onSubmit={handleLinkSubmit} className="space-y-4">
                                <div>
                                    <Label className={`dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ಹೆಸರು' : 'Name'}
                                    </Label>
                                    <Input
                                        value={linkForm.name}
                                        onChange={(e) => setLinkForm({...linkForm, name: e.target.value})}
                                        placeholder={language === 'kn' ? 'ಮೀಡಿಯಾ ಐಟಂನ ಹೆಸರು' : 'Name for this media item'}
                                    />
                                </div>
                                <div>
                                    <Label className={`dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ಪ್ರಕಾರ' : 'Type'}
                                    </Label>
                                    <Select value={linkForm.file_type} onValueChange={(value) => setLinkForm({...linkForm, file_type: value})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">
                                                <div className="flex items-center gap-2">
                                                    <Image className="w-4 h-4" />
                                                    {language === 'kn' ? 'ಚಿತ್ರ' : 'Image'}
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="video">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4" />
                                                    {language === 'kn' ? 'ವೀಡಿಯೊ' : 'Video'}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className={`dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'URL' : 'URL'}
                                    </Label>
                                    <Input
                                        value={linkForm.file_url}
                                        onChange={(e) => setLinkForm({...linkForm, file_url: e.target.value})}
                                        placeholder="https://..."
                                        type="url"
                                    />
                                </div>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    {language === 'kn' ? 'ಸೇರಿಸಿ' : 'Add Media'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Media Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-t"></div>
                            <CardContent className="p-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    mediaItems.map((item) => (
                        <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                            <div className="relative">
                                {renderMediaPreview(item)}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => copyToClipboard(item.file_url)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteMediaItem(item.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-medium text-sm line-clamp-2 dark:text-gray-200">{item.name}</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        {item.file_type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <Image className="w-3 h-3 mr-1" />}
                                        {item.file_type}
                                    </Badge>
                                    {item.file_type === 'video' && getYouTubeEmbedUrl(item.file_url) && (
                                        <Badge className="bg-red-600 text-white text-xs">
                                            <Play className="w-3 h-3 mr-1" />
                                            YouTube
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}