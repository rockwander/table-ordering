-- Buzzer Notifications Table
CREATE TABLE buzzer_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for better performance
CREATE INDEX idx_buzzer_notifications_status ON buzzer_notifications(status);
CREATE INDEX idx_buzzer_notifications_created_at ON buzzer_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE buzzer_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Buzzer notifications are viewable by everyone" ON buzzer_notifications
  FOR SELECT USING (true);

CREATE POLICY "Customers can create buzzer notifications" ON buzzer_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage buzzer notifications" ON buzzer_notifications
  FOR ALL USING (auth.role() = 'authenticated');
