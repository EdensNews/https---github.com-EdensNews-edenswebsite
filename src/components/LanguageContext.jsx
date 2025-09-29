import { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User } from '@/api/user';

const LanguageContext = createContext();
const SUPPORTED_LANGUAGES = ['kn','en','ta','te','hi','ml'];

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('kn'); // Default to Kannada
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadLanguagePreference = async () => {
        setIsLoading(true);
        try {
            // Check cache first
            const cachedUser = localStorage.getItem('cached_user');
            const cachedLang = localStorage.getItem('preferred_language');
            
            if (cachedUser && cachedLang) {
                setUser(JSON.parse(cachedUser));
                setLanguage(cachedLang);
            }

            // Then fetch fresh data
            const currentUser = await User.me();
            setUser(currentUser);
            
            // Cache user data
            localStorage.setItem('cached_user', JSON.stringify(currentUser));
            
            if (currentUser && currentUser.preferred_language) {
                setLanguage(currentUser.preferred_language);
                localStorage.setItem('preferred_language', currentUser.preferred_language);
            } else {
                // User is logged in but no preference set, check localStorage
                const savedLang = localStorage.getItem('preferred_language');
                if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
                    setLanguage(savedLang);
                    // Save this preference to user profile
                    if (currentUser) {
                        await User.updateMyUserData({ preferred_language: savedLang });
                    }
                }
            }
        } catch {
            // User not logged in, check localStorage
            const savedLang = localStorage.getItem('preferred_language');
            if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
                setLanguage(savedLang);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadLanguagePreference();
    }, []);

    const setAppLanguage = async (newLang) => {
        if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
        setLanguage(newLang);
        localStorage.setItem('preferred_language', newLang);
        // Persist only for kn/en due to DB constraint
        if (user && (newLang === 'kn' || newLang === 'en')) {
            try {
                await User.updateMyUserData({ preferred_language: newLang });
                const updatedUser = { ...user, preferred_language: newLang };
                setUser(updatedUser);
                localStorage.setItem('cached_user', JSON.stringify(updatedUser));
            } catch (error) {
                console.error("Failed to update user language preference:", error);
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ 
            language,
            setLanguage: setAppLanguage,
            isLoading,
            user,
            supportedLanguages: SUPPORTED_LANGUAGES
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

LanguageProvider.propTypes = {
    children: PropTypes.node.isRequired
};