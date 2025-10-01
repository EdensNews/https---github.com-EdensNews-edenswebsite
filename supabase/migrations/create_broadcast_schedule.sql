-- Create broadcast_schedule table
CREATE TABLE IF NOT EXISTS broadcast_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    day_name_en TEXT NOT NULL,
    day_name_kn TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    show_name_en TEXT NOT NULL,
    show_name_kn TEXT,
    show_name_ta TEXT,
    show_name_te TEXT,
    show_name_hi TEXT,
    show_name_ml TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_broadcast_schedule_active ON broadcast_schedule(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_broadcast_schedule_day ON broadcast_schedule(day_of_week);

-- Add RLS policies
ALTER TABLE broadcast_schedule ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to broadcast_schedule"
    ON broadcast_schedule
    FOR SELECT
    TO public
    USING (is_active = true);

-- Allow authenticated users with admin role to manage schedule
CREATE POLICY "Allow admin full access to broadcast_schedule"
    ON broadcast_schedule
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Insert default schedule data
INSERT INTO broadcast_schedule (day_of_week, day_name_en, day_name_kn, start_time, end_time, show_name_en, show_name_kn, display_order) VALUES
(1, 'Monday', 'ಸೋಮವಾರ', '18:00:00', '20:00:00', 'Evening News', 'ಸಂಜೆ ಸುದ್ದಿ', 1),
(2, 'Tuesday', 'ಮಂಗಳವಾರ', '18:00:00', '20:00:00', 'Special Report', 'ವಿಶೇಷ ವರದಿ', 2),
(3, 'Wednesday', 'ಬುಧವಾರ', '18:00:00', '20:00:00', 'Interview Special', 'ಸಂದರ್ಶನ ವಿಶೇಷ', 3),
(4, 'Thursday', 'ಗುರುವಾರ', '18:00:00', '20:00:00', 'Political Debate', 'ರಾಜಕೀಯ ಚರ್ಚೆ', 4),
(5, 'Friday', 'ಶುಕ್ರವಾರ', '18:00:00', '20:00:00', 'Week in Review', 'ವಾರದ ಸುದ್ದಿ', 5),
(6, 'Saturday', 'ಶನಿವಾರ', '19:00:00', '21:00:00', 'Special Program', 'ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮ', 6),
(0, 'Sunday', 'ಭಾನುವಾರ', '19:00:00', '21:00:00', 'Weekend Special', 'ವಾರಾಂತ್ಯ ವಿಶೇಷ', 7)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_broadcast_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_broadcast_schedule_updated_at_trigger
    BEFORE UPDATE ON broadcast_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_broadcast_schedule_updated_at();
