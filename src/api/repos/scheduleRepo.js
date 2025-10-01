import { supabase } from '@/api/supabaseClient';

export const scheduleRepo = {
    /**
     * List all active broadcast schedules ordered by day
     */
    async list() {
        const { data, error } = await supabase
            .from('broadcast_schedule')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get schedule for a specific day
     */
    async getByDay(dayOfWeek) {
        const { data, error } = await supabase
            .from('broadcast_schedule')
            .select('*')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Get a single schedule entry by ID
     */
    async get(id) {
        const { data, error } = await supabase
            .from('broadcast_schedule')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new schedule entry
     */
    async create(scheduleData) {
        const { data, error } = await supabase
            .from('broadcast_schedule')
            .insert([scheduleData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an existing schedule entry
     */
    async update(id, scheduleData) {
        const { data, error } = await supabase
            .from('broadcast_schedule')
            .update(scheduleData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a schedule entry (soft delete by setting is_active = false)
     */
    async delete(id) {
        const { error } = await supabase
            .from('broadcast_schedule')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Hard delete a schedule entry
     */
    async hardDelete(id) {
        const { error } = await supabase
            .from('broadcast_schedule')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Get current live show based on current time and day
     */
    async getCurrentLiveShow() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
        const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format

        const { data, error } = await supabase
            .from('broadcast_schedule')
            .select('*')
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .lte('start_time', currentTime)
            .gte('end_time', currentTime)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }
};
