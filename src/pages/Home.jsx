import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { analyticsRepo } from '@/api/repos/analyticsRepo';
import { useLanguage } from '@/components/LanguageContext';
import ArticleCard from '@/components/news/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language, isLoading: languageLoading } = useLanguage();
  const query = useQuery();
  const category = query.get('category');

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        let fetchedArticles = [];
        if (category) {
          const slug = String(category).toLowerCase();
          fetchedArticles = await articlesRepo.listByCategory(slug, { limit: 20 });
          if (!fetchedArticles || fetchedArticles.length === 0) {
            // Fallback to latest if category has no results
            fetchedArticles = await articlesRepo.list({ limit: 20 });
          }
        } else {
          fetchedArticles = await articlesRepo.list({ limit: 20 });
        }
        
        // Load view counts for all articles
        if (fetchedArticles.length > 0) {
          const articleIds = fetchedArticles.map(article => article.id);
          const viewCounts = await analyticsRepo.getViewCounts(articleIds);
          
          // Add view counts to articles
          const articlesWithViews = fetchedArticles.map(article => ({
            ...article,
            views: viewCounts[article.id] || 0
          }));
          
          setArticles(articlesWithViews);
        } else {
          setArticles(fetchedArticles);
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        // Set empty array to prevent infinite loading state
        setArticles([]);
      }
      setIsLoading(false);
    };
    fetchArticles();
  }, [category]);

  // Show loading while language preference is being loaded
  if (languageLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Skeleton className="h-10 w-64 mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) =>
          <div key={index} className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
          )}
                </div>
            </div>);

  }

  const pageTitle = category ?
  language === 'kn' ? `${category} ಸುದ್ದಿ` : `${category} News` :
  language === 'kn' ? 'ಇತ್ತೀಚಿನ ಸುದ್ದಿ' : 'Latest News';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Helmet>
                <title>{`${pageTitle} | Edens News`}</title>
                <meta name="description" content={`Edens News - ${pageTitle}. Your trusted source for multilingual news in Kannada, English, Tamil, Telugu, Hindi, and Malayalam.`} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : 'https://edensnews.com'} />
                <meta property="og:title" content={`${pageTitle} | Edens News`} />
                <meta property="og:description" content={`Edens News - ${pageTitle}. Your trusted source for multilingual news.`} />
                <meta property="og:site_name" content="Edens News" />
                <meta property="og:locale" content={language === 'kn' ? 'kn_IN' : 'en_IN'} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:site" content="@edensnews" />
                <meta name="twitter:title" content={`${pageTitle} | Edens News`} />
                <meta name="twitter:description" content={`Edens News - ${pageTitle}. Your trusted source for multilingual news.`} />
            </Helmet>

            <h2 className="text-2xl mb-8 font-extrabold text-center dark:text-gray-100">
                {pageTitle}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ?
        Array.from({ length: 8 }).map((_, index) =>
        <div key={index} className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-xl" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
        ) :

        articles && articles.length > 0 ? (
          articles.map((article) =>
            <ArticleCard key={article.id} article={article} />
          )
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'kn' ? 'ಯಾವುದೇ ಲೇಖನಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No articles found'}
            </p>
          </div>
        )
        }
            </div>
        </div>);

}