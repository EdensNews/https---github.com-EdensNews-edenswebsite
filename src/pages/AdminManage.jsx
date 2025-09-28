import { useState, useEffect, useCallback } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
    const [isLoading, setIsLoading] = useState(true);
    const { language } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedArticles = await articlesRepo.list({ limit: 50 });
            setArticles(fetchedArticles);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
            toast({ title: "Error fetching articles", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);

    const handleDelete = async (articleId) => {
        try {
            await articlesRepo.delete(articleId);
            toast({ title: "Article deleted successfully" });
            fetchArticles(); // Refresh the list
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
                                        <TableCell><Badge variant="outline">{article.category ? String(article.category).replace(/\b\w/g, c => c.toUpperCase()) : '-'}</Badge></TableCell>
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
                </CardContent>
            </Card>
        </div>
    );
}