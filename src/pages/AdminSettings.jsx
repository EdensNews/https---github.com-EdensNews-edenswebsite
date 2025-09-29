
import { useState, useEffect } from 'react';
import { SiteSettings } from '@/api/entities';
import { User } from '@/api/entities';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Settings, Users, Globe, Shield, ArrowLeft, LogOut, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import { siteSettingsRepo } from '@/api/repos/siteSettingsRepo';

export default function AdminSettings() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminSettingsContent />
        </ProtectedRoute>
    );
}

function AdminSettingsContent() {
    const [settings, setSettings] = useState({
        site_name_kn: 'ಈಡನ್ ನ್ಯೂಸ್',
        site_name_en: 'Eden News',
        tagline_kn: '',
        tagline_en: '',
        contact_email: '',
        contact_phone: '',
        contact_address_kn: '', // Added new field
        contact_address_en: '', // Added new field
        social_facebook: '',
        social_twitter: '',
        social_youtube: '',
        social_instagram: '',
        breaking_news_alert: true,
        auto_translation: true,
        maintenance_mode: false,
        analytics_enabled: true,
        ai_app_url: ''
    });
    
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const { language } = useLanguage();
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load cached first for fast UX
            const cached = localStorage.getItem('cached_site_settings');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setSettings(prev => ({ ...prev, ...parsed }));
                } catch {}
            }

            const [siteSettings, allUsers, user] = await Promise.all([
                SiteSettings.list('-created_date', 1).catch(() => []),
                User.list().catch(() => []),
                User.me().catch(() => null)
            ]);
            
            if (siteSettings.length > 0) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...siteSettings[0],
                    // Ensure new fields are present even if not in DB for older records
                    contact_address_kn: siteSettings[0].contact_address_kn || '',
                    contact_address_en: siteSettings[0].contact_address_en || '',
                    ai_app_url: siteSettings[0].ai_app_url || '' 
                }));
                localStorage.setItem('cached_site_settings', JSON.stringify({
                    ...siteSettings[0]
                }));
            } else {
                // Fallback to Supabase mirror if Base44 entity empty
                try {
                    const latest = await siteSettingsRepo.getLatest();
                    if (latest) {
                        setSettings(prev => ({
                            ...prev,
                            ...latest,
                            contact_address_kn: latest.contact_address_kn || '',
                            contact_address_en: latest.contact_address_en || '',
                            ai_app_url: latest.ai_app_url || ''
                        }));
                        localStorage.setItem('cached_site_settings', JSON.stringify(latest));
                    }
                } catch {}
            }
            setUsers(allUsers);
            setCurrentUser(user);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        setIsLoading(false);
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const existingSettings = await SiteSettings.list('-created_date', 1);
            if (existingSettings.length > 0) {
                await SiteSettings.update(existingSettings[0].id, settings);
            } else {
                await SiteSettings.create(settings);
            }
            // Mirror to Supabase table and cache locally for reliability
            try {
                await siteSettingsRepo.upsert(settings);
            } catch {}
            localStorage.setItem('cached_site_settings', JSON.stringify(settings));
            
            toast({
                title: language === 'kn' ? 'ಸೇವ್ ಆಗಿದೆ!' : 'Saved!',
                description: language === 'kn' 
                    ? 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ'
                    : 'Settings updated successfully'
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

    const handleLogout = async () => {
        try {
            await User.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            await User.update(userId, { role: newRole });
            await loadData(); // Refresh data
            toast({
                title: language === 'kn' ? 'ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ!' : 'Updated!',
                description: language === 'kn' 
                    ? 'ಬಳಕೆದಾರರ ಪಾತ್ರ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ'
                    : 'User role updated successfully'
            });
        } catch (error) {
            console.error('Role update failed:', error);
            toast({
                title: language === 'kn' ? 'ದೋಷ' : 'Error',
                description: language === 'kn' 
                    ? 'ಪಾತ್ರ ಅಪ್‌ಡೇಟ್ ವಿಫಲವಾಯಿತು'
                    : 'Failed to update role',
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-96">Loading...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to={createPageUrl('Admin')}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Settings className="w-8 h-8 text-gray-600" />
                        <h1 className={`text-3xl font-bold text-gray-900 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {language === 'kn' ? 'ಆಡ್ಮಿನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು' : 'Admin Settings'}
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-medium">{currentUser?.full_name}</p>
                        <Badge className="bg-green-100 text-green-800">{currentUser?.role}</Badge>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        {language === 'kn' ? 'ಲಾಗ್‌ಔಟ್' : 'Logout'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general" className={language === 'kn' ? 'font-kannada' : ''}>
                        <Globe className="w-4 h-4 mr-2" />
                        {language === 'kn' ? 'ಸಾಮಾನ್ಯ' : 'General'}
                    </TabsTrigger>
                    <TabsTrigger value="social" className={language === 'kn' ? 'font-kannada' : ''}>
                        <Share2 className="w-4 h-4 mr-2" />
                        {language === 'kn' ? 'ಸಾಮಾಜಿಕ' : 'Social'}
                    </TabsTrigger>
                    <TabsTrigger value="features" className={language === 'kn' ? 'font-kannada' : ''}>
                        <Settings className="w-4 h-4 mr-2" />
                        {language === 'kn' ? 'ವೈಶಿಷ್ಟ್ಯಗಳು' : 'Features'}
                    </TabsTrigger>
                    <TabsTrigger value="users" className={language === 'kn' ? 'font-kannada' : ''}>
                        <Users className="w-4 h-4 mr-2" />
                        {language === 'kn' ? 'ಬಳಕೆದಾರರು' : 'Users'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle className={language === 'kn' ? 'font-kannada' : ''}>
                                {language === 'kn' ? 'ಸೈಟ್ ಮಾಹಿತಿ' : 'Site Information'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-kannada">ಸೈಟ್ ಹೆಸರು (ಕನ್ನಡ)</Label>
                                    <Input
                                        value={settings.site_name_kn}
                                        onChange={(e) => setSettings({...settings, site_name_kn: e.target.value})}
                                        className="font-kannada"
                                    />
                                </div>
                                <div>
                                    <Label>Site Name (English)</Label>
                                    <Input
                                        value={settings.site_name_en}
                                        onChange={(e) => setSettings({...settings, site_name_en: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label className="font-kannada">ಟ್ಯಾಗ್‌ಲೈನ್ (ಕನ್ನಡ)</Label>
                                    <Input
                                        value={settings.tagline_kn}
                                        onChange={(e) => setSettings({...settings, tagline_kn: e.target.value})}
                                        className="font-kannada"
                                        placeholder="ಉದಾ: ನಿಮ್ಮ ವಿಶ್ವಾಸಾರ್ಹ ಸುದ್ದಿ ಮೂಲ"
                                    />
                                </div>
                                <div>
                                    <Label>Tagline (English)</Label>
                                    <Input
                                        value={settings.tagline_en}
                                        onChange={(e) => setSettings({...settings, tagline_en: e.target.value})}
                                        placeholder="e.g., Your trusted news source"
                                    />
                                </div>
                                <div>
                                    <Label className={language === 'kn' ? 'font-kannada' : ''}>
                                        {language === 'kn' ? 'ಸಂಪರ್ಕ ಇಮೇಲ್' : 'Contact Email'}
                                    </Label>
                                    <Input
                                        type="email"
                                        value={settings.contact_email}
                                        onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                                        placeholder="contact@edenstv.com"
                                    />
                                </div>
                                <div>
                                    <Label className={language === 'kn' ? 'font-kannada' : ''}>
                                        {language === 'kn' ? 'ಸಂಪರ್ಕ ಫೋನ್' : 'Contact Phone'}
                                    </Label>
                                    <Input
                                        value={settings.contact_phone}
                                        onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                                        placeholder="+91 80 1234 5678"
                                    />
                                </div>
                                {/* New Address Fields */}
                                <div>
                                    <Label className="font-kannada">ವಿಳಾಸ (ಕನ್ನಡ)</Label>
                                    <Input
                                        value={settings.contact_address_kn}
                                        onChange={(e) => setSettings({...settings, contact_address_kn: e.target.value})}
                                        className="font-kannada"
                                        placeholder="ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ, ಭಾರತ"
                                    />
                                </div>
                                <div>
                                    <Label>Address (English)</Label>
                                    <Input
                                        value={settings.contact_address_en}
                                        onChange={(e) => setSettings({...settings, contact_address_en: e.target.value})}
                                        placeholder="Bangalore, Karnataka, India"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className={language === 'kn' ? 'font-kannada' : ''}>
                                    {language === 'kn' ? 'PM ಅಪ್ಲಿಕೇಶನ್ ಹೈಪರ್‌ಲಿಂಕ್' : 'PM App Hyperlink'}
                                </Label>
                                <Input
                                    value={settings.ai_app_url}
                                    onChange={(e) => setSettings({...settings, ai_app_url: e.target.value})}
                                    placeholder="https://yourpmapp.com"
                                />
                                <p className={`text-sm text-gray-500 mt-1 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' ? 'ಹೆಡರ್‌ನಲ್ಲಿ PM ಲಿಂಕ್‌ಗಾಗಿ URL ಅನ್ನು ನಮೂದಿಸಿ.' : 'Enter the URL for the PM link in the header.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="social">
                    <Card>
                        <CardHeader>
                            <CardTitle className={language === 'kn' ? 'font-kannada' : ''}>
                                {language === 'kn' ? 'ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ' : 'Social Media'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Facebook Page URL</Label>
                                    <Input
                                        value={settings.social_facebook}
                                        onChange={(e) => setSettings({...settings, social_facebook: e.target.value})}
                                        placeholder="https://facebook.com/edennews"
                                    />
                                </div>
                                <div>
                                    <Label>Twitter Profile URL</Label>
                                    <Input
                                        value={settings.social_twitter}
                                        onChange={(e) => setSettings({...settings, social_twitter: e.target.value})}
                                        placeholder="https://twitter.com/edennews"
                                    />
                                </div>
                                <div>
                                    <Label>YouTube Channel URL</Label>
                                    <Input
                                        value={settings.social_youtube}
                                        onChange={(e) => setSettings({...settings, social_youtube: e.target.value})}
                                        placeholder="https://youtube.com/@edennews"
                                    />
                                </div>
                                <div>
                                    <Label>Instagram Profile URL</Label>
                                    <Input
                                        value={settings.social_instagram}
                                        onChange={(e) => setSettings({...settings, social_instagram: e.target.value})}
                                        placeholder="https://instagram.com/edennews"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features">
                    <Card>
                        <CardHeader>
                            <CardTitle className={language === 'kn' ? 'font-kannada' : ''}>
                                {language === 'kn' ? 'ವೈಶಿಷ್ಟ್ಯ ಸೆಟ್ಟಿಂಗ್‌ಗಳು' : 'Feature Settings'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className={`font-medium ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್ ಅಲರ್ಟ್‌ಗಳು' : 'Breaking News Alerts'}
                                    </h4>
                                    <p className={`text-sm text-gray-500 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' 
                                            ? 'ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್ ಪುಶ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ'
                                            : 'Enable push notifications for breaking news'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.breaking_news_alert}
                                    onCheckedChange={(checked) => 
                                        setSettings({...settings, breaking_news_alert: checked})
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className={`font-medium ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ಸ್ವಯಂ ಅನುವಾದ' : 'Auto Translation'}
                                    </h4>
                                    <p className={`text-sm text-gray-500 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' 
                                            ? 'AI ಆಧಾರಿತ ಸ್ವಯಂ ಅನುವಾದವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ'
                                            : 'Enable AI-powered automatic translation'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.auto_translation}
                                    onCheckedChange={(checked) => 
                                        setSettings({...settings, auto_translation: checked})
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className={`font-medium ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ಅನಾಲಿಟಿಕ್ಸ್' : 'Analytics'}
                                    </h4>
                                    <p className={`text-sm text-gray-500 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' 
                                            ? 'ಬಳಕೆದಾರರ ಅನಾಲಿಟಿಕ್ಸ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಸಕ್ರಿಯಗೊಳಿಸಿ'
                                            : 'Enable user analytics and tracking'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.analytics_enabled}
                                    onCheckedChange={(checked) => 
                                        setSettings({...settings, analytics_enabled: checked})
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                                <div>
                                    <h4 className={`font-medium text-red-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' ? 'ನಿರ್ವಹಣೆ ಮೋಡ್' : 'Maintenance Mode'}
                                    </h4>
                                    <p className={`text-sm text-red-600 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {language === 'kn' 
                                            ? 'ಸೈಟ್ ಅನ್ನು ನಿರ್ವಹಣೆ ಮೋಡ್‌ನಲ್ಲಿ ಇರಿಸಿ (ಎಚ್ಚರಿಕೆ!)'
                                            : 'Put the site in maintenance mode (Warning!)'
                                        }
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenance_mode}
                                    onCheckedChange={(checked) => 
                                        setSettings({...settings, maintenance_mode: checked})
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle className={language === 'kn' ? 'font-kannada' : ''}>
                                {language === 'kn' ? 'ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ' : 'User Management'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="font-medium text-gray-600">
                                                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.full_name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                                                {user.role}
                                            </Badge>
                                            {user.id !== currentUser?.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                                >
                                                    <Shield className="w-4 h-4 mr-1" />
                                                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-8">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? (language === 'kn' ? 'ಸೇವ್ ಆಗುತ್ತಿದೆ...' : 'Saving...') 
                             : (language === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಸೇವ್ ಮಾಡಿ' : 'Save Settings')}
                </Button>
            </div>
        </div>
    );
}
