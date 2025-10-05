
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Article } from '@/api/entities';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { analyticsRepo } from '@/api/repos/analyticsRepo';
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
    const [topArticles, setTopArticles] = useState([]);
    const [topChartData, setTopChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [debug, setDebug] = useState({ envOk: false, articles: 0, viewsTableCount: 0, recent: [] });
    const { language } = useLanguage();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Try Supabase repo first (this is what the site uses in production)
            let articles = [];
            try {
                articles = await articlesRepo.list({ limit: 100 }); // Reduced from 1000 to save bandwidth
            } catch {}
            // Fallback to Base44 entities if Supabase is not configured
            if (!Array.isArray(articles) || articles.length === 0) {
                try {
                    articles = await Article.list('', 1000);
                } catch {
                    articles = [];
                }
            }
            // Derive distinct users from views (fallback metric)
            const distinctUsers = await analyticsRepo.countDistinctUsers();
            
            const totalArticles = articles.length;
            // Compute views from article_views table
            let totalViews = 0;
            let counts = {};
            try {
                counts = await analyticsRepo.getViewCounts(articles.map(a => a.id));
                totalViews = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
            } catch {}
            const totalUsers = distinctUsers;
            
            setStats({ totalArticles, totalViews, totalUsers });
            
            const categories = articles.reduce((acc, article) => {
                const key = article.category || 'uncategorized';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            
            const chartData = Object.entries(categories)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setCategoryData(chartData);

            // Build top articles list from counts
            const withViews = articles.map(a => ({
                id: a.id,
                title: a.title_en || a.title_kn || '—',
                category: a.category || '-',
                views: counts[a.id] || 0
            }));
            withViews.sort((a, b) => b.views - a.views);
            setTopArticles(withViews);

            // Chart data for top 10 articles
            const top10 = withViews.slice(0, 10).map(item => ({
                name: item.title.length > 30 ? item.title.slice(0, 27) + '…' : item.title,
                views: item.views
            }));
            setTopChartData(top10);

            // Debug panel: show env and recent rows to diagnose empty UI
            try {
                const totalViewRows = await analyticsRepo.countAll();
                const recent = await analyticsRepo.listRecent(5);
                setDebug({ envOk: true, articles: articles.length, viewsTableCount: totalViewRows, recent });
            } catch {
                setDebug(prev => ({ ...prev, envOk: false }));
            }

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

            <div className="grid gap-6 lg:grid-cols-2 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'kn' ? 'ಟಾಪ್ ಲೇಖನಗಳು (ವೀಕ್ಷಣೆಗಳು)' : 'Top Articles (Views)'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="w-full h-80" /> : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="py-2 pr-4">#</th>
                                            <th className="py-2 pr-4">{language === 'kn' ? 'ಶೀರ್ಷಿಕೆ' : 'Title'}</th>
                                            <th className="py-2 pr-4 hidden md:table-cell">{language === 'kn' ? 'ವರ್ಗ' : 'Category'}</th>
                                            <th className="py-2 pr-4">{language === 'kn' ? 'ವೀಕ್ಷಣೆಗಳು' : 'Views'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topArticles.slice(0, 25).map((a, idx) => (
                                            <tr key={a.id} className="border-t border-gray-100 dark:border-gray-800">
                                                <td className="py-2 pr-4">{idx + 1}</td>
                                                <td className="py-2 pr-4">{a.title}</td>
                                                <td className="py-2 pr-4 hidden md:table-cell">{a.category || '-'}</td>
                                                <td className="py-2 pr-4 font-medium">{a.views.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'kn' ? 'ಟಾಪ್ 10 ಲೇಖನಗಳು (ಚಾರ್ಟ್)' : 'Top 10 Articles (Chart)'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="w-full h-80" /> : (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={topChartData} margin={{ top: 5, right: 30, left: 10, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="views" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
