import { useState, useEffect, useCallback } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Trash2, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminManage() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminManageContent />
        </ProtectedRoute>
    );
}

function AdminManageContent() {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { language } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();
    const pageSize = 50;

    const fetchArticles = useCallback(async (pageNum = 0) => {
        setIsLoading(true);
        try {
            const offset = pageNum * pageSize;
            let fetchedArticles;
            
            // Fetch articles with optional category filter
            const apiUrl = import.meta.env.VITE_API_URL || 'https://api.edensnews.com/api';
            const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
            const response = await fetch(`${apiUrl}/articles?limit=${pageSize}&offset=${offset}&status=published${categoryParam}`);
            fetchedArticles = await response.json();
            
            // Enrich articles with category names
            const enrichedArticles = await Promise.all(
                fetchedArticles.map(async (article) => {
                    try {
                        // Get article categories from article_categories table
                        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.edensnews.com/api'}/article-categories/${article.id}`);
                        if (response.ok) {
                            const articleCats = await response.json();
                            if (articleCats && articleCats.length > 0) {
                                const category = categories.find(c => c.id === articleCats[0].category_id);
                                return { ...article, categoryName: category ? (language === 'kn' ? category.name_kn : category.name_en) : '-' };
                            }
                        }
                    } catch (err) {
                        console.error('Error fetching category for article:', err);
                    }
                    return { ...article, categoryName: '-' };
                })
            );
            
            setArticles(enrichedArticles);
            setHasMore(fetchedArticles.length === pageSize);
            setPage(pageNum);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
            toast({ title: "Error fetching articles", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast, pageSize, selectedCategory, categories, language]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await categoriesRepo.list();
                setCategories(cats);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setPage(0);
        fetchArticles(0);
    };

    const handleDelete = async (articleId) => {
        try {
            await articlesRepo.delete(articleId);
            toast({ title: "Article deleted successfully" });
            
            // Remove article from local state immediately for instant UI update
            setArticles(prevArticles => prevArticles.filter(a => a.id !== articleId));
            
            // Then refresh the list from server
            fetchArticles(page);
        } catch (error) {
            console.error("Failed to delete article:", error);
            toast({ title: "Error deleting article", variant: "destructive" });
        }
    };

    const handleEdit = (articleId) => {
        navigate(createPageUrl(`AdminWrite?editId=${articleId}`));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to={createPageUrl('Admin')}>
                        <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <h1 className={`text-3xl font-bold ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಲೇಖನಗಳನ್ನು ನಿರ್ವಹಿಸಿ' : 'Manage Articles'}
                    </h1>
                </div>
                <Link to={createPageUrl('AdminWrite')}>
                    <Button className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        {language === 'kn' ? 'ಹೊಸ ಲೇಖನ' : 'New Article'}
                    </Button>
                </Link>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={language === 'kn' ? 'ವರ್ಗ ಆಯ್ಕೆಮಾಡಿ' : 'Select Category'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{language === 'kn' ? 'ಎಲ್ಲಾ ವರ್ಗಗಳು' : 'All Categories'}</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.slug}>
                                {language === 'kn' ? (cat.name_kn || cat.name_en) : cat.name_en}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{language === 'kn' ? 'ಇತ್ತೀಚಿನ ಲೇಖನಗಳು' : 'Recent Articles'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className={language === 'kn' ? 'font-kannada' : ''}>{language === 'kn' ? 'ಶೀರ್ಷಿಕೆ' : 'Title'}</TableHead>
                                <TableHead className={language === 'kn' ? 'font-kannada' : ''}>{language === 'kn' ? 'ವರ್ಗ' : 'Category'}</TableHead>
                                <TableHead className={language === 'kn' ? 'font-kannada' : ''}>{language === 'kn' ? 'ವರದಿಗಾರ' : 'Reporter'}</TableHead>
                                <TableHead className={language === 'kn' ? 'font-kannada' : ''}>{language === 'kn' ? 'ದಿನಾಂಕ' : 'Date'}</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={5} className="h-12"></TableCell></TableRow>
                                ))
                            ) : (
                                articles.map(article => (
                                    <TableRow key={article.id}>
                                        <TableCell className="font-medium max-w-xs truncate" title={(article.title_kn || article.title_en || '')}>
                                            <span className={language === 'kn' ? 'font-kannada' : ''}>
                                                {language === 'kn' 
                                                    ? (article.title_kn || article.title_en || '') 
                                                    : (article.title_en || article.title_kn || '')}
                                            </span>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{article.categoryName || '-'}</Badge></TableCell>
                                        <TableCell>{article.reporter}</TableCell>
                                        <TableCell>{(() => { const raw = article.created_at || article.created_date; const d = raw ? new Date(raw) : null; const valid = d && !isNaN(d.getTime()); return valid ? format(d, 'dd MMM yyyy') : '-'; })()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="icon" onClick={() => handleEdit(article.id)}><Edit className="w-4 h-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the article.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(article.id)}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            onClick={() => fetchArticles(page - 1)}
                            disabled={page === 0 || isLoading}
                        >
                            {language === 'kn' ? 'ಹಿಂದಿನದು' : 'Previous'}
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'kn' ? `ಪುಟ ${page + 1}` : `Page ${page + 1}`}
                        </span>
                        <Button 
                            variant="outline" 
                            onClick={() => fetchArticles(page + 1)}
                            disabled={!hasMore || isLoading}
                        >
                            {language === 'kn' ? 'ಮುಂದಿನದು' : 'Next'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}