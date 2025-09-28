
import React, { useState, useEffect, useCallback } from 'react';
import { rssRepo } from '@/api/repos/rssRepo';
import { fetchRss } from '@/api/functions';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, ArrowLeft, Trash2, Rss, Import, ExternalLink, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AdminRss() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminRssContent />
        </ProtectedRoute>
    );
}

function AdminRssContent() {
    const [feeds, setFeeds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', url: '' });
    const [selectedFeed, setSelectedFeed] = useState(null);
    const [feedArticles, setFeedArticles] = useState([]);
    const [isFetchingArticles, setIsFetchingArticles] = useState(false);
    
    const { language } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

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

    const handleSaveFeed = async () => {
        if (!formData.name || !formData.url) {
            toast({ title: "Please provide both name and URL", variant: "destructive" });
            return;
        }

        try {
            await rssRepo.create(formData);
            toast({ title: "RSS Feed added successfully!" });
            setFormData({ name: '', url: '' });
            loadFeeds();
        } catch (error) {
            console.error('Failed to save feed:', error);
            toast({ title: "Failed to save RSS feed", variant: "destructive" });
        }
    };

    const handleDeleteFeed = async (id) => {
        if (confirm('Are you sure you want to delete this RSS feed?')) {
            try {
                await rssRepo.remove(id);
                toast({ title: "RSS Feed deleted!" });
                if (selectedFeed?.id === id) {
                    setSelectedFeed(null);
                    setFeedArticles([]);
                }
                loadFeeds();
            } catch (error) {
                console.error('Failed to delete feed:', error);
                toast({ title: "Failed to delete RSS feed", variant: "destructive" });
            }
        }
    };

    const handleFetchArticles = async (feed) => {
        setSelectedFeed(feed);
        setFeedArticles([]);
        setIsFetchingArticles(true);
        try {
            const { data, error } = await fetchRss({ url: feed.url });
            
            if (error) {
                throw new Error(error);
            }
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setFeedArticles(data.articles || []);
            
            // Only update last_fetched_at if we successfully fetched articles
            if (data.articles && data.articles.length > 0) {
                try {
                    await rssRepo.update(feed.id, { last_fetched_at: new Date().toISOString() });
                    await loadFeeds();
                } catch (updateError) {
                    console.warn('Failed to update feed timestamp:', updateError);
                    // Don't fail the whole operation if we can't update the timestamp
                }
            } else {
                toast({ 
                  title: "No articles found", 
                  description: "The RSS feed appears to be empty or invalid", 
                  variant: "destructive" 
                });
            }
        } catch (error) {
            console.error('Failed to fetch articles:', error);
            toast({ 
                title: "Failed to fetch articles from feed", 
                description: error.message || "Please check the URL and try again later", 
                variant: "destructive" 
            });
        }
        setIsFetchingArticles(false);
    };

    const handleImportArticle = (article) => {
        navigate(createPageUrl('AdminWrite'), { state: { rssItem: article } });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={createPageUrl('Admin')}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <Rss className="w-8 h-8 text-orange-400" />
                    <h1 className={`text-3xl font-bold text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'RSS ಫೀಡ್ ನಿರ್ವಹಣೆ' : 'RSS Feed Management'}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Feeds List & Form */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Add New Feed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="feed-name">Feed Name</Label>
                                <Input id="feed-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., BBC News" />
                            </div>
                            <div>
                                <Label htmlFor="feed-url">Feed URL</Label>
                                <Input id="feed-url" type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://feeds.bbci.co.uk/news/rss.xml" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveFeed} className="w-full">
                                <Save className="w-4 h-4 mr-2" /> Save Feed
                            </Button>
                        </CardFooter>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Feeds</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {isLoading ? (
                                <Skeleton className="h-20 w-full" />
                            ) : feeds.length > 0 ? (
                                feeds.map(feed => (
                                    <div key={feed.id} className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-800 ${selectedFeed?.id === feed.id ? 'bg-gray-800 ring-2 ring-orange-500' : 'border-gray-700'}`} onClick={() => handleFetchArticles(feed)}>
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{feed.name}</p>
                                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); handleDeleteFeed(feed.id); }}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">{feed.url}</p>
                                        {feed.last_fetched_at && <p className="text-xs text-gray-500 mt-1">Last fetched: {format(new Date(feed.last_fetched_at), 'Pp')}</p>}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">No feeds added yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Articles from selected feed */}
                <div className="lg:col-span-2">
                    <Card className="min-h-full">
                        <CardHeader>
                            <CardTitle>Feed Articles</CardTitle>
                            <CardDescription>{selectedFeed ? `Showing articles from ${selectedFeed.name}` : "Select a feed to see its articles."}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isFetchingArticles ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                </div>
                            ) : feedArticles.length > 0 ? (
                                <div className="space-y-4">
                                    {feedArticles.map((article, index) => (
                                        <div key={index} className="p-4 border border-gray-700 rounded-lg">
                                            <h3 className="font-bold">{article.title}</h3>
                                            <p className="text-xs text-gray-400 mb-2">{article.pubDate ? format(new Date(article.pubDate), 'PPpp') : 'No date'}</p>
                                            <p className="text-sm text-gray-300 line-clamp-2" dangerouslySetInnerHTML={{ __html: article.description }} />
                                            <div className="flex gap-2 mt-3">
                                                <Button size="sm" variant="outline" onClick={() => handleImportArticle(article)}>
                                                    <Import className="w-4 h-4 mr-2" /> Import
                                                </Button>
                                                <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                    <Button size="sm" variant="ghost">
                                                        <ExternalLink className="w-4 h-4 mr-2" /> Read More
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500">
                                    <p>{selectedFeed ? "No articles found in this feed." : "Select a feed from the left."}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
