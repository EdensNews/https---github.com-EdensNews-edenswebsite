import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/api/user';

const LanguageContext = createContext();

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
                if (savedLang && (savedLang === 'kn' || savedLang === 'en')) {
                    setLanguage(savedLang);
                    // Save this preference to user profile
                    if (currentUser) {
                        await User.updateMyUserData({ preferred_language: savedLang });
                    }
                }
            }
        } catch (error) {
            // User not logged in, check localStorage
            const savedLang = localStorage.getItem('preferred_language');
            if (savedLang && (savedLang === 'kn' || savedLang === 'en')) {
                setLanguage(savedLang);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadLanguagePreference();
    }, []);

    const toggleLanguage = async () => {
        const newLang = language === 'kn' ? 'en' : 'kn';
        setLanguage(newLang);
        
        // Always save to localStorage first
        localStorage.setItem('preferred_language', newLang);
        
        // If user is logged in, also save to their profile
        if (user) {
            try {
                await User.updateMyUserData({ preferred_language: newLang });
                // Update cached user data
                const updatedUser = { ...user, preferred_language: newLang };
                setUser(updatedUser);
                localStorage.setItem('cached_user', JSON.stringify(updatedUser));
            } catch (error) {
                console.error("Failed to update user language preference:", error);
                // Don't revert the local change if server update fails
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ 
            language, 
            toggleLanguage, 
            isLoading,
            user 
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);