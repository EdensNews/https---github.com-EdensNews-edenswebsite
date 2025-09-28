import React, { useState, useEffect } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
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
        setArticles(fetchedArticles);
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