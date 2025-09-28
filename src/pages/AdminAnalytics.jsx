
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Article } from '@/api/entities';
import { User } from '@/api/entities';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Eye, Users, BarChartHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function AdminAnalytics() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminAnalyticsContent />
        </ProtectedRoute>
    );
}

function AdminAnalyticsContent() {
    const [stats, setStats] = useState({ totalArticles: 0, totalViews: 0, totalUsers: 0 });
    const [categoryData, setCategoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [articles, users] = await Promise.all([Article.list('', 1000), User.list()]);
            
            const totalArticles = articles.length;
            const totalViews = articles.reduce((sum, art) => sum + (art.views || 0), 0);
            const totalUsers = users.length;
            
            setStats({ totalArticles, totalViews, totalUsers });
            
            const categories = articles.reduce((acc, article) => {
                acc[article.category] = (acc[article.category] || 0) + 1;
                return acc;
            }, {});
            
            const chartData = Object.entries(categories)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setCategoryData(chartData);

        } catch (error) {
            console.error("Failed to fetch analytics data:", error);
        }
        setIsLoading(false);
    };

    const StatCard = ({ title, value, icon: Icon }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    );

    StatCard.propTypes = {
        title: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        icon: PropTypes.elementType.isRequired
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={createPageUrl('Admin')}><Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
                <h1 className={`text-3xl font-bold ${language === 'kn' ? 'font-kannada' : ''}`}>{language === 'kn' ? 'ಅಂಕಿಅಂಶಗಳು' : 'Analytics'}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <StatCard title={language === 'kn' ? 'ಒಟ್ಟು ಲೇಖನಗಳು' : 'Total Articles'} value={stats.totalArticles} icon={FileText} />
                <StatCard title={language === 'kn' ? 'ಒಟ್ಟು ವೀಕ್ಷಣೆಗಳು' : 'Total Views'} value={stats.totalViews.toLocaleString()} icon={Eye} />
                <StatCard title={language === 'kn' ? 'ಒಟ್ಟು ಬಳಕೆದಾರರು' : 'Total Users'} value={stats.totalUsers} icon={Users} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChartHorizontal />
                        {language === 'kn' ? 'ವರ್ಗಗಳ ಪ್ರಕಾರ ಲೇಖನಗಳು' : 'Articles by Category'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="w-full h-80" /> : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }}/>
                                <Bar dataKey="count" fill="#f97316" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
