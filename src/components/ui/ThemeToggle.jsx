import { useTheme } from '@/components/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Loader2 } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme, isLoading } = useTheme();

    if (isLoading) {
        return (
            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" disabled>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </Button>
        );
    }

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="rounded-full w-10 h-10 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-orange-600" />
            ) : (
                <Moon className="w-5 h-5 text-orange-600" />
            )}
        </Button>
    );
}