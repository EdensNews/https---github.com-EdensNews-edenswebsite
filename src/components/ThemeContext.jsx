import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/api/user';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light'); // Default to light
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadThemePreference = async () => {
        setIsLoading(true);
        try {
            // First, try to get user's saved preference
            const currentUser = await User.me();
            setUser(currentUser);
            
            if (currentUser && currentUser.preferred_theme) {
                setTheme(currentUser.preferred_theme);
                localStorage.setItem('preferred_theme', currentUser.preferred_theme);
            } else {
                // User is logged in but no preference set, check localStorage
                const savedTheme = localStorage.getItem('preferred_theme');
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                    setTheme(savedTheme);
                    // Save this preference to user profile
                    if (currentUser) {
                        await User.updateMyUserData({ preferred_theme: savedTheme });
                    }
                }
            }
        } catch (error) {
            // User not logged in, check localStorage
            const savedTheme = localStorage.getItem('preferred_theme');
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                setTheme(savedTheme);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadThemePreference();
    }, []);

    // Apply theme to document
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        
        // Always save to localStorage first
        localStorage.setItem('preferred_theme', newTheme);
        
        // If user is logged in, also save to their profile
        if (user) {
            try {
                await User.updateMyUserData({ preferred_theme: newTheme });
            } catch (error) {
                console.error("Failed to update user theme preference:", error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            toggleTheme, 
            isLoading,
            user 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);