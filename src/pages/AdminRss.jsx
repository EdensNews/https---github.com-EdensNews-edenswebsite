
import { useState, useEffect, useCallback } from 'react';
import { rssRepo } from '@/api/repos/rssRepo';
import { fetchRss } from '@/api/functions';
import { useLanguage } from '@/components/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
    const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
    
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
        setCurrentArticleIndex(0); // Reset to first article
        setIsFetchingArticles(true);
        try {
            const { data, error } = await fetchRss({ url: feed.url });
            
            if (error) {
                throw new Error(error);
            }
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            const allArticles = data.articles || [];
            
            if (allArticles.length === 0) {
                toast({ 
                  title: "No articles found", 
                  description: "The RSS feed appears to be empty or invalid", 
                  variant: "destructive" 
                });
                setFeedArticles([]);
                setIsFetchingArticles(false);
                return;
            }

            // Pre-populate processed articles table for future reference
            await rssRepo.prePopulateProcessedArticles(feed.id, allArticles);
            
            // Bulk check which articles are already processed (much faster)
            let newArticles;
            try {
                newArticles = await rssRepo.checkMultipleArticlesProcessed(feed.id, allArticles);
            } catch (error) {
                console.warn('Deduplication check failed, showing all articles:', error);
                newArticles = allArticles; // Fallback to showing all articles
            }
            
            const processedCount = { 
                total: allArticles.length, 
                new: newArticles.length 
            };

            setFeedArticles(newArticles);

            // Show appropriate message based on results
            if (newArticles.length === 0) {
                if (processedCount.total > 0) {
                    toast({ 
                      title: "No new articles", 
                      description: `All ${processedCount.total} articles from this RSS feed already exist in your database.`, 
                      variant: "default" 
                    });
                } else {
                    toast({ 
                      title: "No articles found", 
                      description: "No articles available in this RSS feed.", 
                      variant: "default" 
                    });
                }
            } else {
                const duplicateCount = processedCount.total - processedCount.new;
                if (duplicateCount > 0) {
                    toast({ 
                      title: "New articles found", 
                      description: `Found ${processedCount.new} new articles (${duplicateCount} duplicates filtered out).`, 
                      variant: "default" 
                    });
                } else {
                    toast({ 
                      title: "Articles loaded", 
                      description: `Found ${processedCount.new} new articles from RSS feed.`, 
                      variant: "default" 
                    });
                }
            }
            
            // Update last_fetched_at regardless of new articles
            try {
                await rssRepo.update(feed.id, { last_fetched_at: new Date().toISOString() });
                await loadFeeds();
            } catch (updateError) {
                console.warn('Failed to update feed timestamp:', updateError);
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
        // Add feed ID to the RSS item for tracking
        const rssItemWithFeedId = {
            ...article,
            feedId: selectedFeed?.id
        };
        
        // Show confirmation before importing
        toast({ 
            title: "Importing Article", 
            description: `Starting translation of: ${article.title.substring(0, 50)}...`,
            duration: 2000
        });
        
        navigate(createPageUrl('AdminWrite'), { state: { rssItem: rssItemWithFeedId } });
    };

    const handleNextArticle = () => {
        if (currentArticleIndex < feedArticles.length - 1) {
            setCurrentArticleIndex(currentArticleIndex + 1);
        }
    };

    const handlePreviousArticle = () => {
        if (currentArticleIndex > 0) {
            setCurrentArticleIndex(currentArticleIndex - 1);
        }
    };

    const handleSkipArticle = () => {
        if (currentArticleIndex < feedArticles.length - 1) {
            setCurrentArticleIndex(currentArticleIndex + 1);
        } else {
            toast({ 
                title: "No more articles", 
                description: "You've reached the end of the RSS feed articles.", 
                variant: "default" 
            });
        }
    };

    const handleRefreshArticles = async () => {
        if (selectedFeed) {
            await handleFetchArticles(selectedFeed);
            toast({ 
                title: "Articles Refreshed", 
                description: "RSS feed has been updated to show current articles.",
                duration: 2000
            });
        }
    };

    // Handle returning from article import
    useEffect(() => {
        // Check if we're returning from an import (you can add logic here)
        // For now, we'll just ensure the current article is still displayed
        if (feedArticles.length > 0 && currentArticleIndex >= feedArticles.length) {
            setCurrentArticleIndex(feedArticles.length - 1);
        }
    }, [feedArticles.length, currentArticleIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (feedArticles.length === 0) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    handlePreviousArticle();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    handleNextArticle();
                    break;
                case ' ':
                    event.preventDefault();
                    handleSkipArticle();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentArticleIndex, feedArticles.length]);

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
                            <CardDescription>
                                {selectedFeed ? `Showing articles from ${selectedFeed.name}` : "Select a feed to see its articles."}
                                {feedArticles.length > 0 && (
                                    <span className="block mt-2 text-xs text-gray-500">
                                        Use Previous/Next buttons or arrow keys to navigate. Press Space to skip articles.
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isFetchingArticles ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                </div>
                            ) : feedArticles.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Article Counter and Controls */}
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-gray-400">
                                            Article {currentArticleIndex + 1} of {feedArticles.length}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={handleRefreshArticles}
                                                title="Refresh articles to update list"
                                            >
                                                Refresh
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={handlePreviousArticle}
                                                disabled={currentArticleIndex === 0}
                                            >
                                                Previous
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={handleNextArticle}
                                                disabled={currentArticleIndex === feedArticles.length - 1}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Single Article Display */}
                                    {(() => {
                                        const article = feedArticles[currentArticleIndex];
                                        return (
                                            <div className="p-6 border border-gray-700 rounded-lg bg-gray-800/50">
                                                <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                                                <p className="text-xs text-gray-400 mb-3">
                                                    {article.pubDate ? format(new Date(article.pubDate), 'PPpp') : 'No date'}
                                                </p>
                                                <div 
                                                    className="text-sm text-gray-300 mb-4 prose prose-invert max-w-none" 
                                                    dangerouslySetInnerHTML={{ __html: article.description }} 
                                                />
                                                
                                                {/* Action Buttons */}
                                                <div className="flex gap-3 mt-6">
                                                    <Button 
                                                        onClick={() => handleImportArticle(article)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                        size="lg"
                                                    >
                                                        <Import className="w-4 h-4 mr-2" /> Import & Translate This Article
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={handleSkipArticle}
                                                        size="lg"
                                                    >
                                                        Skip This Article
                                                    </Button>
                                                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="lg">
                                                            <ExternalLink className="w-4 h-4 mr-2" /> Read Original
                                                        </Button>
                                                    </a>
                                                </div>
                                                
                                                {/* Import Instructions */}
                                                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                                                    <p className="text-sm text-blue-300">
                                                        <strong>One Article at a Time:</strong> Click "Import & Translate" to translate this single article. 
                                                        After importing, use "Refresh" to update the list and see remaining articles.
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
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
