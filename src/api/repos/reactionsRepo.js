import { supabase } from '@/api/supabaseClient';

export const reactionsRepo = {
    /**
     * Get reaction counts for an article
     */
    async getCounts(articleId) {
        const { data, error } = await supabase
            .from('article_reaction_counts')
            .select('*')
            .eq('article_id', articleId);

        if (error) throw error;
        
        // Convert to object format
        const counts = {
            like: 0,
            love: 0,
            wow: 0,
            sad: 0,
            angry: 0
        };
        
        data?.forEach(item => {
            counts[item.reaction_type] = item.count;
        });
        
        return counts;
    },

    /**
     * Get user's reactions for an article
     */
    async getUserReactions(articleId, userId) {
        if (!userId) return [];
        
        const { data, error } = await supabase
            .from('article_reactions')
            .select('reaction_type')
            .eq('article_id', articleId)
            .eq('user_id', userId);

        if (error) throw error;
        return data?.map(r => r.reaction_type) || [];
    },

    /**
     * Add a reaction
     */
    async addReaction(articleId, userId, reactionType) {
        const { data, error } = await supabase
            .from('article_reactions')
            .insert([{
                article_id: articleId,
                user_id: userId,
                reaction_type: reactionType
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove a reaction
     */
    async removeReaction(articleId, userId, reactionType) {
        const { error } = await supabase
            .from('article_reactions')
            .delete()
            .eq('article_id', articleId)
            .eq('user_id', userId)
            .eq('reaction_type', reactionType);

        if (error) throw error;
        return true;
    },

    /**
     * Toggle a reaction (add if not exists, remove if exists)
     */
    async toggleReaction(articleId, userId, reactionType) {
        const userReactions = await this.getUserReactions(articleId, userId);
        
        if (userReactions.includes(reactionType)) {
            await this.removeReaction(articleId, userId, reactionType);
            return false; // Removed
        } else {
            await this.addReaction(articleId, userId, reactionType);
            return true; // Added
        }
    }
};
