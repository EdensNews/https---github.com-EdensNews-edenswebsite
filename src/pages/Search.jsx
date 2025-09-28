import { useState } from 'react';
import { articlesRepo } from '@/api/repos/articlesRepo';
import { useLanguage } from '@/components/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import ArticleCard from '@/components/news/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [hasSearched, setHasSearched] = useState(false);
    const { language } = useLanguage();

    const categories = [
        { value: 'all', label: language === 'kn' ? 'ಎಲ್ಲಾ ವರ್ಗಗಳು' : 'All Categories' },
        { value: 'Politics', label: language === 'kn' ? 'ರಾಜಕೀಯ' : 'Politics' },
        { value: 'Technology', label: language === 'kn' ? 'ತಂತ್ರಜ್ಞಾನ' : 'Technology' },
        { value: 'Sports', label: language === 'kn' ? 'ಕ್ರೀಡೆ' : 'Sports' },
        { value: 'Entertainment', label: language === 'kn' ? 'ಮನರಂಜನೆ' : 'Entertainment' },
        { value: 'Karnataka', label: language === 'kn' ? 'ಕರ್ನಾಟಕ' : 'Karnataka' },
        { value: 'World', label: language === 'kn' ? 'ಪ್ರಪಂಚ' : 'World' }
    ];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        setHasSearched(true);
        
        try {
            const q = searchQuery.trim();
            let results = [];
            if (selectedCategory !== 'all') {
                const slug = String(selectedCategory).toLowerCase();
                results = await articlesRepo.searchByCategory(q, slug, { limit: 100 });
            } else {
                results = await articlesRepo.search(q, { limit: 100 });
            }
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        }
        
        setIsSearching(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
        setSelectedCategory('all');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-3xl mx-auto mb-8">
                <h1 className={`text-3xl font-bold text-center mb-8 ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? 'ಸುದ್ದಿ ಹುಡುಕಿ' : 'Search News'}
                </h1>
                
                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={language === 'kn' ? 'ಸುದ್ದಿ ಹುಡುಕಿ...' : 'Search for news...'}
                            className={`pl-12 pr-12 py-6 text-lg ${language === 'kn' ? 'font-kannada' : ''}`}
                        />
                        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    
                    {/* Filters */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching} className="bg-orange-600 hover:bg-orange-700">
                            <SearchIcon className="w-4 h-4 mr-2" />
                            {language === 'kn' ? 'ಹುಡುಕಿ' : 'Search'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div>
                {isSearching && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="space-y-4">
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-3/4" />
                            </div>
                        ))}
                    </div>
                )}

                {hasSearched && !isSearching && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className={`text-xl font-semibold ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' ? 'ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು' : 'Search Results'}
                                </h2>
                                <Badge variant="secondary">
                                    {searchResults.length} {language === 'kn' ? 'ಫಲಿತಾಂಶಗಳು' : 'results'}
                                </Badge>
                            </div>
                            {searchResults.length > 0 && (
                                <Button variant="outline" onClick={clearSearch}>
                                    <X className="w-4 h-4 mr-2" />
                                    {language === 'kn' ? 'ಕ್ಲಿಯರ್' : 'Clear'}
                                </Button>
                            )}
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {searchResults.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className={`text-xl font-medium text-gray-500 mb-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' ? 'ಯಾವುದೇ ಫಲಿತಾಂಶಗಳು ಇಲ್ಲ' : 'No results found'}
                                </h3>
                                <p className={`text-gray-400 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {language === 'kn' 
                                        ? 'ದಯವಿಟ್ಟು ಬೇರೆ ಕೀವರ್ಡ್‌ಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ'
                                        : 'Try different keywords or adjust your filters'
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}