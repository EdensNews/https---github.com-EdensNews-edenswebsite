
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/user';
import { siteSettingsRepo } from '@/api/repos/siteSettingsRepo';
import { categoriesRepo } from '@/api/repos/categoriesRepo';
import { Menu, Search, Radio, Shield, User as UserIcon, LogIn, Bookmark, ChevronDown, Bot } from 'lucide-react';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';
import { Badge } from '@/components/ui/badge';
import AdSenseAd from '@/components/AdSenseAd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { name: 'Home', page: 'Home', kn_name: 'ಮುಖಪುಟ' },
  { name: 'Live TV', page: 'LiveTV', kn_name: 'ಲೈವ್ ಟಿವಿ', isLive: true },
  { name: 'Categories', kn_name: 'ವರ್ಗಗಳು', type: 'dropdown' },
  { name: 'Search', page: 'Search', kn_name: 'ಹುಡುಕಿ' }
];

const fallbackCategoryLinks = [
  { slug: 'politics', name: 'Politics', kn_name: 'ರಾಜಕೀಯ' },
  { slug: 'crime', name: 'Crime', kn_name: 'ಅಪರಾಧ' },
  { slug: 'technology', name: 'Technology', kn_name: 'ತಂತ್ರಜ್ಞಾನ' },
  { slug: 'entertainment', name: 'Entertainment', kn_name: 'ಮನರಂಜನೆ' },
  { slug: 'sports', name: 'Sports', kn_name: 'ಕ್ರೀಡೆ' },
  { slug: 'karnataka', name: 'Karnataka', kn_name: 'ಕರ್ನಾಟಕ' },
  { slug: 'world', name: 'World', kn_name: 'ಪ್ರಪಂಚ' }
];

export default function Header() {
  const { user, isLoading: userLoading } = useLanguage();
  const { language } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const goHome = () => {
    setIsMobileMenuOpen(false);
    try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch {}
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Check cache first
        const cachedSettings = localStorage.getItem('cached_site_settings');
        if (cachedSettings) {
          // Settings loaded from cache
        }

        const latest = await siteSettingsRepo.getLatest();
        if (latest) {
          // Cache the settings
          localStorage.setItem('cached_site_settings', JSON.stringify(latest));
        }
      } catch (error) {
        console.error("Failed to fetch site settings", error);
      }
    };
    const fetchCategories = async () => {
      try {
        const rows = await categoriesRepo.list();
        if (Array.isArray(rows) && rows.length) {
          setCategories(rows.map(r => ({ slug: r.slug, name: r.name || r.slug })));
        } else {
          setCategories(fallbackCategoryLinks);
        }
      } catch {
        console.warn('Failed to load categories for header, using fallback');
        setCategories(fallbackCategoryLinks);
      }
    };
    fetchSettings();
    fetchCategories();
  }, []);

  const handleLogin = async () => {
    try {
      // Use Google OAuth by default; you can switch to magic link if preferred
      await User.loginWithOAuth('google', window.location.href);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      // Clear cached user data
      localStorage.removeItem('cached_user');
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-red-700/80 shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 relative">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 group">
              <Link to={createPageUrl('Home')} aria-label="Edens News Home" className="flex items-center gap-2 header-logo-link" onClick={goHome}>
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ad7ff9cf8628b96fa8c1c8/703b84b08_GeneratedImageAugust282025-9_11PM.png"
                    alt="Edens News"
                    className="w-8 h-10 sm:w-10 sm:h-12 lg:w-14 lg:h-16 object-contain transform group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </div>
                <h1 className="text-base sm:text-lg lg:text-2xl font-extrabold text-transparent bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 bg-clip-text tracking-tight">
                  {language === 'kn' ?
                    <span className="font-kannada">ಈಡೆನ್ಸ್ ನ್ಯೂಸ್</span> :
                    'Edens News'
                  }
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navLinks.map((link) => {
                if (link.type === 'dropdown') {
                  return (
                    <DropdownMenu key={link.name}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={`flex items-center gap-1 text-sm xl:text-base font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 focus-visible:ring-0 px-2 xl:px-3 ${language === 'kn' ? 'font-kannada' : ''}`}>
                          {language === 'kn' ? link.kn_name : link.name}
                          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="animate-in slide-in-from-top-2 duration-200">
                        {categories.map((catLink) =>
                          <DropdownMenuItem key={catLink.name} asChild>
                            <Link
                              to={createPageUrl(`Home?category=${catLink.slug}`)}
                              className={`w-full cursor-pointer hover:bg-red-900/20 transition-colors ${language === 'kn' ? 'font-kannada' : ''}`}>
                              {catLink.name}
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    to={createPageUrl(link.page)}
                    className={`flex items-center gap-1 xl:gap-2 text-sm xl:text-base font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 p-2 rounded-md ${language === 'kn' ? 'font-kannada' : ''}`}>
                    {language === 'kn' ? link.kn_name : link.name}
                    {link.isLive &&
                      <Badge className="bg-red-600 text-white text-xs px-1 py-0.5 ml-1 animate-pulse shadow-lg">
                        LIVE
                      </Badge>
                    }
                  </Link>
                );
              })}
              <a
                href="https://easywaytutor.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm xl:text-base font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 p-2 rounded-md ${language === 'kn' ? 'font-kannada' : ''}`}>
                <Bot className="w-4 h-4" />
                Pocket Master
              </a>
            </nav>

            {/* Mobile + Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Live TV Button */}
              <div className="md:hidden">
                <Link
                  to={createPageUrl('LiveTV')}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-center gap-1 text-xs font-medium text-gray-300 hover:text-red-400 transition-all duration-200 px-2 py-2 rounded-md min-h-[44px] mobile-header-button ${language === 'kn' ? 'font-kannada' : ''}`}
                  style={{
                    minWidth: 'auto',
                    touchAction: 'manipulation'
                  }}>
                  <Radio className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{language === 'kn' ? 'ಲೈವ್' : 'LIVE'}</span>
                  <Badge className="bg-red-600 text-white text-xs px-1 py-0.5 animate-pulse shadow-lg flex-shrink-0">
                    TV
                  </Badge>
                </Link>
              </div>

              {/* Desktop User Actions */}
              <div className="hidden md:flex items-center gap-2">
                {!userLoading &&
                  <>
                    {user ?
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="flex items-center gap-2 h-8 xl:h-10 hover:bg-red-900/20 transition-colors px-2">
                            <div className="w-6 h-6 xl:w-8 xl:h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                              <UserIcon className="w-3 h-3 xl:w-4 xl:h-4 text-white" />
                            </div>
                            <span className="hidden lg:block text-xs xl:text-sm font-medium">{user.full_name?.split(' ')[0] || 'User'}</span>
                            {user.role === 'admin' && <Badge className="bg-green-900/30 text-green-400 text-xs hidden xl:block">Admin</Badge>}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 xl:w-56 animate-in slide-in-from-top-2 duration-200">
                          <div className="px-2 py-1.5">
                            <p className="text-sm font-medium">{user.full_name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={createPageUrl('Bookmarks')} className="flex items-center gap-2 hover:bg-red-900/20">
                              <Bookmark className="w-4 h-4" />
                              {language === 'kn' ? 'ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು' : 'My Bookmarks'}
                            </Link>
                          </DropdownMenuItem>
                          {user.role === 'admin' &&
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl('Admin')} className="flex items-center gap-2 hover:bg-red-900/20">
                                <Shield className="w-4 h-4" />
                                {language === 'kn' ? 'ಆಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್' : 'Admin Panel'}
                              </Link>
                            </DropdownMenuItem>
                          }
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 hover:bg-red-900/20">
                            {language === 'kn' ? 'ಲಾಗ್‌ಔಟ್' : 'Logout'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> :
                      <Button variant="ghost" onClick={handleLogin} className="flex items-center gap-1 xl:gap-2 hover:bg-red-900/20 transition-colors text-xs xl:text-sm px-2 xl:px-3">
                        <LogIn className="w-3 h-3 xl:w-4 xl:h-4" />
                        <span className="hidden lg:block">{language === 'kn' ? 'ಲಾಗಿನ್' : 'Login'}</span>
                      </Button>
                    }
                  </>
                }
                <LanguageToggle />
              </div>

              {/* Mobile Language Toggle */}
              <div className="md:hidden">
                <div className="min-h-[44px] flex items-center justify-center mobile-header-button">
                  <LanguageToggle />
                </div>
              </div>

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Open menu"
                    className="md:hidden w-12 h-12 flex items-center justify-center rounded-lg hover:bg-red-900/20 active:bg-red-900/30 transition-colors touch-manipulation select-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    style={{
                      minWidth: '48px',
                      minHeight: '48px',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(153, 27, 27, 0.3)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(153, 27, 27, 0.3)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className={language === 'kn' ? 'font-kannada' : ''}>
                      {language === 'kn' ? 'ನ್ಯಾವಿಗೇಷನ್' : 'Navigation'}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4 mt-8 pb-4">
                    {/* User Section */}
                    {!userLoading && (
                      <div className="border-b border-gray-700 pb-4">
                        {user ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{user.full_name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <Link to={createPageUrl('Bookmarks')} onClick={closeMobileMenu} className={`flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                              <Bookmark className="w-4 h-4" />
                              {language === 'kn' ? 'ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು' : 'My Bookmarks'}
                            </Link>
                            {user.role === 'admin' && (
                              <Link to={createPageUrl('Admin')} onClick={closeMobileMenu} className={`flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                <Shield className="w-4 h-4" />
                                {language === 'kn' ? 'ಆಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್' : 'Admin Panel'}
                              </Link>
                            )}
                            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-400 hover:bg-red-900/20">
                              {language === 'kn' ? 'ಲಾಗ್‌ಔಟ್' : 'Logout'}
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={handleLogin} className="w-full">
                            <LogIn className="w-4 h-4 mr-2" />
                            {language === 'kn' ? 'ಲಾಗಿನ್' : 'Login'}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Navigation Links */}
                    <div className="space-y-2">
                      <Link to={createPageUrl('Home')} onClick={closeMobileMenu} className={`flex items-center gap-2 text-base font-medium p-3 rounded hover:bg-gray-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ಮುಖಪುಟ' : 'Home'}
                      </Link>
                      <Link to={createPageUrl('Search')} onClick={closeMobileMenu} className={`flex items-center gap-2 text-base font-medium p-3 rounded hover:bg-gray-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        <Search className="w-4 h-4" />
                        {language === 'kn' ? 'ಹುಡುಕಿ' : 'Search'}
                      </Link>
                      <a href="https://easywaytutor.netlify.app/" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-base font-medium p-3 rounded hover:bg-gray-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        <Bot className="w-4 h-4" />
                        Pocket Master
                      </a>
                    </div>

                    {/* Categories */}
                    <div className="border-t border-gray-700 pt-4">
                      <h3 className={`text-sm font-semibold text-gray-400 mb-2 ${language === 'kn' ? 'font-kannada' : ''}`}>
                        {language === 'kn' ? 'ವರ್ಗಗಳು' : 'Categories'}
                      </h3>
                      <div className="space-y-1">
                        {categories.map((catLink) => (
                          <Link
                            key={catLink.slug}
                            to={createPageUrl(`Home?category=${catLink.slug}`)}
                            onClick={closeMobileMenu}
                            className={`block text-sm p-2 rounded hover:bg-gray-800 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {catLink.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Header AdSense Banner */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <AdSenseAd
            slot="1234567890"
            format="horizontal"
            className="mx-auto"
            style={{ display: 'block', textAlign: 'center', minHeight: '90px' }}
          />
        </div>
      </div>
    </>
  );
}
