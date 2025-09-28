
import React, { useState, useEffect } from 'react';
import { streamSettingsRepo } from '@/api/repos/streamSettingsRepo';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, Radio, Copy, Eye, ArrowLeft, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminStream() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminStreamContent />
        </ProtectedRoute>
    );
}

function AdminStreamContent() {
    const [streamSettings, setStreamSettings] = useState({
        stream_title: '',
        youtube_url: '',
        is_live: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const { language } = useLanguage();
    const { toast } = useToast();

    useEffect(() => {
        loadStreamSettings();
    }, []);

    const loadStreamSettings = async () => {
        setIsLoading(true);
        try {
            const latest = await streamSettingsRepo.getLatest();
            if (latest) {
                setStreamSettings({
                    stream_title: latest.subtitle || '',
                    youtube_url: latest.stream_url || '',
                    is_live: !!latest.is_live,
                });
            }
        } catch (error) {
            console.error('Failed to load stream settings:', error);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Map UI fields to DB fields
            const payload = {
                subtitle: streamSettings.stream_title || null,
                stream_url: streamSettings.youtube_url || null,
                is_live: !!streamSettings.is_live,
            };
            await streamSettingsRepo.upsert(payload);
            
            toast({
                title: language === 'kn' ? 'ಸೇವ್ ಆಗಿದೆ!' : 'Saved!',
                description: language === 'kn' 
                    ? 'ಸ್ಟ್ರೀಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ'
                    : 'Stream settings updated successfully'
            });
        } catch (error) {
            console.error('Save failed:', error);
            toast({
                title: language === 'kn' ? 'ದೋಷ' : 'Error',
                description: language === 'kn' 
                    ? 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಸೇವ್ ಆಗಲಿಲ್ಲ'
                    : 'Failed to save settings',
                variant: "destructive"
            });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-96">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <Radio className="w-8 h-8 text-red-600" />
                    <h1 className={`text-3xl font-bold text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಲೈವ್ ಸ್ಟ್ರೀಮ್ ನಿರ್ವಹಣೆ' : 'Live Stream Management'}
                    </h1>
                </div>
            </div>

            <div className="space-y-6">
                 <Alert>
                    <Youtube className="h-4 w-4" />
                    <AlertDescription className={language === 'kn' ? 'font-kannada' : ''}>
                        {language === 'kn' 
                            ? 'ನಿಮ್ಮ YouTube ಲೈವ್ ಸ್ಟ್ರೀಮ್‌ನ ಸಂಪೂರ್ಣ URL ಅನ್ನು ಇಲ್ಲಿ ಅಂಟಿಸಿ. ಇದು ಲೈವ್ ಟಿವಿ ಪುಟದಲ್ಲಿ ಎಲ್ಲಾ ವೀಕ್ಷಕರಿಗೆ ಜಾಗತಿಕ ಸ್ಟ್ರೀಮ್ ಆಗಿರುತ್ತದೆ.'
                            : 'Paste the full URL of your YouTube Live Stream here. This will be the global stream for all visitors on the Live TV page.'
                        }
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className={`dark:text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಸ್ಟ್ರೀಮ್ ಸ್ಥಿತಿ' : 'Stream Status'}
                            </CardTitle>
                            <Badge className={streamSettings.is_live ? 'bg-red-600' : 'bg-gray-600'}>
                                {streamSettings.is_live ? 'LIVE' : 'OFFLINE'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={streamSettings.is_live}
                                onCheckedChange={(checked) => 
                                    setStreamSettings({...streamSettings, is_live: checked})
                                }
                            />
                            <Label className={`dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಲೈವ್ ಪ್ರಸಾರ ಸಕ್ರಿಯ' : 'Enable Live Broadcast'}
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className={`dark:text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? 'ಸ್ಟ್ರೀಮ್ ವಿವರಗಳು' : 'Stream Details'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className={`dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'ಸ್ಟ್ರೀಮ್ ಶೀರ್ಷಿಕೆ' : 'Stream Title'}
                            </Label>
                            <Input
                                value={streamSettings.stream_title}
                                onChange={(e) => setStreamSettings({...streamSettings, stream_title: e.target.value})}
                                placeholder={language === 'kn' ? 'ಉದಾ: ಈಡನ್ ನ್ಯೂಸ್ ಲೈವ್' : 'e.g., Eden News Live'}
                            />
                        </div>

                        <div>
                            <Label className={`dark:text-gray-300 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' ? 'YouTube ಲೈವ್ URL' : 'YouTube Live URL'}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={streamSettings.youtube_url}
                                    onChange={(e) => setStreamSettings({...streamSettings, youtube_url: e.target.value})}
                                    placeholder="https://www.youtube.com/watch?v=VzRfDIegUUA"
                                />
                                <Link to={createPageUrl('LiveTV')}>
                                    <Button variant="outline" size="icon">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? (language === 'kn' ? 'ಸೇವ್ ಆಗುತ್ತಿದೆ...' : 'Saving...') 
                                 : (language === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಸೇವ್ ಮಾಡಿ' : 'Save Settings')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
