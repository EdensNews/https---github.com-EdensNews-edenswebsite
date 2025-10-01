import { useState, useEffect } from 'react';
import { reactionsRepo } from '@/api/repos/reactionsRepo';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';

const REACTIONS = [
    { type: 'like', emoji: '👍', label: { en: 'Like', kn: 'ಇಷ್ಟ' } },
    { type: 'love', emoji: '❤️', label: { en: 'Love', kn: 'ಪ್ರೀತಿ' } },
    { type: 'wow', emoji: '😮', label: { en: 'Wow', kn: 'ವಾವ್' } },
    { type: 'sad', emoji: '😢', label: { en: 'Sad', kn: 'ದುಃಖ' } },
    { type: 'angry', emoji: '😠', label: { en: 'Angry', kn: 'ಕೋಪ' } }
];

export default function ArticleReactions({ articleId }) {
    const [counts, setCounts] = useState({ like: 0, love: 0, wow: 0, sad: 0, angry: 0 });
    const [userReactions, setUserReactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, language } = useLanguage();

    useEffect(() => {
        loadReactions();
    }, [articleId, user]);

    const loadReactions = async () => {
        try {
            const [reactionCounts, userReactionsList] = await Promise.all([
                reactionsRepo.getCounts(articleId),
                user ? reactionsRepo.getUserReactions(articleId, user.id) : Promise.resolve([])
            ]);
            
            setCounts(reactionCounts);
            setUserReactions(userReactionsList);
        } catch (error) {
            console.error('Failed to load reactions:', error);
        }
        setIsLoading(false);
    };

    const handleReaction = async (reactionType) => {
        if (!user) {
            alert(language === 'kn' ? 'ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ' : 'Please login to react');
            return;
        }

        try {
            const added = await reactionsRepo.toggleReaction(articleId, user.id, reactionType);
            
            // Update local state
            setCounts(prev => ({
                ...prev,
                [reactionType]: added ? prev[reactionType] + 1 : prev[reactionType] - 1
            }));
            
            setUserReactions(prev => 
                added 
                    ? [...prev, reactionType]
                    : prev.filter(r => r !== reactionType)
            );
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex gap-2">
                {REACTIONS.map(reaction => (
                    <div key={reaction.type} className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="my-6">
            <h3 className={`text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 ${language === 'kn' ? 'font-kannada' : ''}`}>
                {language === 'kn' ? 'ಪ್ರತಿಕ್ರಿಯೆಗಳು' : 'Reactions'}
            </h3>
            <div className="flex flex-wrap gap-2">
                {REACTIONS.map(reaction => {
                    const isActive = userReactions.includes(reaction.type);
                    const count = counts[reaction.type] || 0;
                    
                    return (
                        <Button
                            key={reaction.type}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleReaction(reaction.type)}
                            className={`flex items-center gap-2 transition-all duration-300 ${
                                isActive 
                                    ? 'bg-red-600 hover:bg-red-700 text-white scale-110' 
                                    : 'hover:scale-105'
                            }`}
                        >
                            <span className="text-xl">{reaction.emoji}</span>
                            <span className={`text-sm font-medium ${language === 'kn' ? 'font-kannada' : ''}`}>
                                {reaction.label[language] || reaction.label.en}
                            </span>
                            {count > 0 && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                    isActive 
                                        ? 'bg-white/20' 
                                        : 'bg-gray-200 dark:bg-gray-700'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
