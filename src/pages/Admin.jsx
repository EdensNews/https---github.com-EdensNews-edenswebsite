
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PenTool, Radio, FileText, Settings, BarChart3, Upload, Rss, RefreshCw, ChartBar, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const adminSections = [
    {
        title: { kn: 'ಲೇಖನ ಬರೆಯಿರಿ', en: 'Write Article' },
        description: { kn: 'ಹೊಸ ಸುದ್ದಿ ಲೇಖನಗಳನ್ನು ರಚಿಸಿ ಮತ್ತು ಪ್ರಕಟಿಸಿ', en: 'Create and publish new news articles' },
        icon: PenTool,
        page: 'AdminWrite',
        color: 'from-blue-500 to-blue-600'
    },
    {
        title: { kn: 'ಲೇಖನಗಳನ್ನು ನಿರ್ವಹಿಸಿ', en: 'Manage Articles' },
        description: { kn: 'ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಲೇಖನಗಳನ್ನು ಸಂಪಾದಿಸಿ ಅಥವಾ ಅಳಿಸಿ', en: 'Edit or delete existing articles' },
        icon: FileText,
        page: 'AdminManage',
        color: 'from-green-500 to-green-600'
    },
    {
        title: { kn: 'ಲೈವ್ ಸ್ಟ್ರೀಮ್', en: 'Live Stream' },
        description: { kn: 'ಲೈವ್ ಟಿವಿ ಸ್ಟ್ರೀಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ', en: 'Manage live TV stream settings' },
        icon: Radio,
        page: 'AdminStream',
        color: 'from-red-500 to-red-600'
    },
    {
        title: { kn: 'ಪ್ರಸಾರ ವೇಳಾಪಟ್ಟಿ', en: 'Broadcast Schedule' },
        description: { kn: 'ಲೈವ್ ಟಿವಿ ವೇಳಾಪಟ್ಟಿಯನ್ನು ನಿರ್ವಹಿಸಿ', en: 'Manage live TV broadcast schedule' },
        icon: Calendar,
        page: 'AdminSchedule',
        color: 'from-pink-500 to-pink-600'
    },
    {
        title: { kn: 'ವರ್ಗಗಳು', en: 'Categories' },
        description: { kn: 'ಸುದ್ದಿ ವರ್ಗಗಳನ್ನು ಸೇರಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ', en: 'Add and manage news categories' },
        icon: BarChart3,
        page: 'AdminCategories',
        color: 'from-purple-500 to-purple-600'
    },
    {
        title: { kn: 'ಅನಾಲಿಟಿಕ್ಸ್', en: 'Analytics' },
        description: { kn: 'ವೀಕ್ಷಣೆಗಳು, ಟ್ರೆಂಡಿಂಗ್, ಟಾಪ್ ಲೇಖನಗಳು ಇತ್ಯಾದಿಯನ್ನು ನೋಡಿ', en: 'View traffic, trending, top articles, and more' },
        icon: ChartBar,
        page: 'AdminAnalytics',
        color: 'from-amber-500 to-amber-600'
    },
    {
        title: { kn: 'ಮೀಡಿಯಾ ಲೈಬ್ರರಿ', en: 'Media Library' },
        description: { kn: 'ಚಿತ್ರಗಳು ಮತ್ತು ವೀಡಿಯೊಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ', en: 'Upload images and videos' },
        icon: Upload,
        page: 'AdminMedia',
        color: 'from-indigo-500 to-indigo-600'
    },
    {
        title: { kn: 'RSS ಫೀಡ್‌ಗಳು', en: 'RSS Feeds' },
        description: { kn: 'RSS ಫೀಡ್‌ಗಳಿಂದ ಲೇಖನಗಳನ್ನು ಆಮದು ಮಾಡಿ', en: 'Import articles from RSS feeds' },
        icon: Rss,
        page: 'AdminRss',
        color: 'from-orange-500 to-orange-600'
    },
    {
        title: { kn: 'ಸೈಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು', en: 'Site Settings' },
        description: { kn: 'ಜಾಗತಿಕ ಸೈಟ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ', en: 'Configure global site settings' },
        icon: Settings,
        page: 'AdminSettings',
        color: 'from-gray-500 to-gray-600'
    },
    {
        title: { kn: 'ಸ್ವಯಂಚಾಲಿತ ಅನುವಾದ', en: 'Auto Translation' },
        description: { kn: 'RSS ಫೀಡ್‌ಗಳಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅನುವಾದಿಸಿ', en: 'Automatically translate from RSS feeds' },
        icon: RefreshCw,
        page: 'AdminAutoTranslate',
        color: 'from-cyan-500 to-cyan-600'
    }
];

export default function Admin() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminContent />
        </ProtectedRoute>
    );
}

function AdminContent() {
    const { language } = useLanguage();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className={`text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? 'ಆಡ್ಮಿನ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Admin Dashboard'}
                </h1>
                <p className={`text-gray-600 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn'
                        ? 'ನಿಮ್ಮ ಸುದ್ದಿ ಸೈಟ್ ಅನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಹೊಸ ವಿಷಯವನ್ನು ರಚಿಸಿ'
                        : 'Manage your news site and create new content'
                    }
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminSections.map((section) => (
                    <Link key={section.page} to={createPageUrl(section.page)}>
                        <Card className="h-full hover:shadow-xl dark:hover:shadow-gray-900/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center`}>
                                        <section.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <CardTitle className={`text-lg dark:text-gray-200 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                        {section.title[language]}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-gray-600 dark:text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {section.description[language]}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
