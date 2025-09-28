import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { User } from '@/api/user';
import { useLanguage } from '@/components/LanguageContext';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { language } = useLanguage();

    useEffect(() => {
        checkAuthentication();
    }, [checkAuthentication]);

    const checkAuthentication = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            setIsAuthenticated(true);
            
            // Check if admin access is required
            if (requireAdmin && currentUser.role !== 'admin') {
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
            setUser(null);
        }
        setIsLoading(false);
    }, [requireAdmin]);

    const handleLogin = async () => {
        try {
            await User.loginWithOAuth('google', window.location.href);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20">
                <Card className="text-center">
                    <CardHeader>
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            {requireAdmin ? (
                                <Shield className="w-8 h-8 text-orange-600" />
                            ) : (
                                <AlertTriangle className="w-8 h-8 text-orange-600" />
                            )}
                        </div>
                        <CardTitle className={`text-2xl ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {!user ? (
                                language === 'kn' ? 'ಪ್ರವೇಶ ಅಗತ್ಯ' : 'Login Required'
                            ) : (
                                language === 'kn' ? 'ಆಡ್ಮಿನ್ ಪ್ರವೇಶ ಅಗತ್ಯ' : 'Admin Access Required'
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className={`text-gray-600 ${language === 'kn' ? 'font-kannada' : ''}`}>
                            {!user ? (
                                language === 'kn' 
                                    ? 'ಈ ಪುಟವನ್ನು ಪ್ರವೇಶಿಸಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.'
                                    : 'Please login to access this page.'
                            ) : (
                                language === 'kn' 
                                    ? 'ಈ ಪುಟವನ್ನು ಪ್ರವೇಶಿಸಲು ನಿಮಗೆ ಆಡ್ಮಿನ್ ಅನುಮತಿಗಳ ಅಗತ್ಯವಿದೆ.'
                                    : 'You need admin permissions to access this page.'
                            )}
                        </p>
                        
                        {!user ? (
                            <Button onClick={handleLogin} className="bg-orange-600 hover:bg-orange-700">
                                {language === 'kn' ? 'ಲಾಗಿನ್' : 'Login'}
                            </Button>
                        ) : (
                            <div className={`text-sm text-gray-500 ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {language === 'kn' 
                                    ? 'ಆಡ್ಮಿನ್ ಪ್ರವೇಶಕ್ಕಾಗಿ ಸೈಟ್ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                                    : 'Contact the site administrator for admin access.'
                                }
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requireAdmin: PropTypes.bool
};