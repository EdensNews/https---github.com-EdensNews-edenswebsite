import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Search, Bookmark, Tv, User } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function MobileBottomNav() {
    const location = useLocation();
    const { language, user } = useLanguage();
    
    const navItems = [
        {
            id: 'home',
            name: language === 'kn' ? 'ಮುಖಪುಟ' : 'Home',
            icon: Home,
            path: '/home',
            active: location.pathname === '/' || location.pathname === '/home'
        },
        {
            id: 'search',
            name: language === 'kn' ? 'ಹುಡುಕು' : 'Search',
            icon: Search,
            path: '/search',
            active: location.pathname === '/search'
        },
        {
            id: 'livetv',
            name: language === 'kn' ? 'ಲೈವ್' : 'Live',
            icon: Tv,
            path: '/livetv',
            active: location.pathname === '/livetv'
        },
        {
            name: language === 'kn' ? 'ಬುಕ್‌ಮಾರ್ಕ್' : 'Saved',
            icon: Bookmark,
            path: '/bookmarks',
            active: location.pathname === '/bookmarks',
            id: 'bookmarks'
        },
        {
            name: language === 'kn' ? 'ಪ್ರೊಫೈಲ್' : 'Profile',
            icon: User,
            path: user ? '/admin' : '/bookmarks',
            active: location.pathname === '/admin',
            id: 'profile'
        }
    ];

    return (
        <>
            {/* Mobile Bottom Navigation - Only visible on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.id || item.path}
                                to={createPageUrl(item.path.replace('/', ''))}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                                    item.active
                                        ? 'text-red-600 dark:text-red-500'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <Icon 
                                    className={`w-6 h-6 mb-1 transition-transform ${
                                        item.active ? 'scale-110' : ''
                                    }`} 
                                />
                                <span className={`text-xs font-medium ${language === 'kn' ? 'font-kannada' : ''}`}>
                                    {item.name}
                                </span>
                                {item.active && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-red-600 rounded-t-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
            
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="md:hidden h-16" />
            
            <style>{`
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
        </>
    );
}
