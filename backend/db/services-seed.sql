-- ProTeam Services Seed Data
-- Run this in Supabase SQL Editor

-- Insert sample services (with IDs 1-8)
INSERT INTO public.services (slug, name, tagline, description, icon, is_active, sort_order)
VALUES
  ('cctv-systems', 'CCTV Surveillance System', '4K AI-Powered Cameras with Remote Access', 'Professional video surveillance systems for round-the-clock monitoring with AI motion detection and night vision.', '📹', true, 1),
  ('access-control', 'Access Control System', 'Biometric & Smart Card Authentication', 'Biometric and smart card access systems for secure entry management with real-time monitoring.', '🔐', true, 2),
  ('alarm-systems', 'Wireless Alarm Security System', '4G + WiFi Detection with Instant Alerts', 'Advanced intrusion detection with 24/7 monitoring and instant mobile alerts.', '🚨', true, 3),
  ('fire-safety', 'Fire Alarm Systems', '500-Point Addressable Detection', 'Advanced fire detection and suppression systems compliant with BS5839 and international standards.', '🔥', true, 4),
  ('networking', 'Structured Cabling & Networking', 'Gigabit PoE Networks & NVR Integration', 'Enterprise networking infrastructure for reliable, high-performance connectivity and device integration.', '📡', true, 5),
  ('biometric', 'Biometric Authentication', 'Iris Recognition & Anti-Spoofing', 'Advanced iris and fingerprint recognition for high-security access to facilities.', '👁️', true, 6),
  ('time-tracking', 'Time & Attendance System', 'Touchless & RFID Attendance Tracking', 'Automated employee time tracking and attendance management with payroll integration.', '⏰', true, 7),
  ('electrical', 'Electrical Products & Installation', 'Full-Project Electrical Solutions', 'Complete electrical installation and equipment supply for all residential and commercial projects.', '⚡', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- Link products to services by category
UPDATE public.products SET service_id = 1 WHERE category = 'CCTV' AND service_id IS NULL;
UPDATE public.products SET service_id = 2 WHERE category = 'Access Control' AND service_id IS NULL;
UPDATE public.products SET service_id = 3 WHERE category = 'Alarms' AND id != 9 AND service_id IS NULL;
UPDATE public.products SET service_id = 4 WHERE id = 9 AND service_id IS NULL;  -- Fire Alarm specific
UPDATE public.products SET service_id = 5 WHERE category = 'Networking' AND service_id IS NULL;
UPDATE public.products SET service_id = 6 WHERE category = 'Biometric' AND service_id IS NULL;
UPDATE public.products SET service_id = 3 WHERE category = 'Residential' AND service_id IS NULL;  -- Default to Alarms

-- Verify data was inserted
SELECT COUNT(*) as service_count FROM public.services;
SELECT COUNT(*) as linked_products FROM public.products WHERE service_id IS NOT NULL;
