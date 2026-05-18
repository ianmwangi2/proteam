-- =============================================================
-- Proteam Group — Seed Data (Service Portal)
-- Run AFTER schema.sql in Supabase SQL Editor
-- =============================================================

-- ── Services ─────────────────────────────────────────────────

insert into public.services (slug, name, tagline, description, icon, sort_order, features) values
  ('cctv-surveillance',
   'CCTV & Surveillance',
   'See everything, miss nothing',
   'Professional HD and 4K surveillance camera systems for homes, offices and large-scale facilities. Includes installation, cabling and remote monitoring setup.',
   'camera',
   1,
   '["4K & HD Options", "AI Motion Detection", "Night Vision", "Remote Monitoring", "Cloud Storage"]'),

  ('access-control',
   'Access Control',
   'Control who goes where',
   'Biometric fingerprint, face recognition and RFID card systems to manage entry points across your premises with full audit trails.',
   'lock',
   2,
   '["Biometric Authentication", "RFID Cards", "Multi-door Management", "Visitor Logs", "Integration Ready"]'),

  ('alarm-systems',
   'Alarm Systems',
   'Instant alerts, total protection',
   'Intruder, fire and panic alarm systems for residential and commercial properties. UL-certified sensors with 24/7 monitoring capability.',
   'bell-alert',
   3,
   '["Intrusion Detection", "Fire & Smoke Alarms", "24/7 Monitoring", "SMS & App Alerts", "Backup Battery"]'),

  ('electric-fencing',
   'Electric Fencing',
   'The perimeter that stops threats cold',
   'Energized perimeter security solutions compliant with Kenyan regulations. Includes gate automation, warning signs and surge protection.',
   'zap',
   4,
   '["High-voltage Deterrent", "Zone Control Panel", "Gate Automation", "Surge Protection", "Compliant Install"]'),

  ('networking',
   'Networking & Structured Cabling',
   'Infrastructure built to last',
   'Cat6/Cat6A structured cabling, PoE switches, wireless access points and server room fit-outs for reliable security and business networks.',
   'network',
   5,
   '["Gigabit PoE Switches", "Cat6 / Cat6A Cabling", "WiFi Access Points", "Server Room Setup", "CCTV Network Design"]'),

  ('home-automation',
   'Home Automation',
   'Smart living, safer home',
   'Integrate security, lighting, climate and entertainment into one connected ecosystem controlled from your phone.',
   'home',
   6,
   '["Smart Locks", "App-controlled Lighting", "Scene Automation", "Voice Assistant Ready", "Energy Monitoring"]')
on conflict (slug) do update set
  name        = excluded.name,
  tagline     = excluded.tagline,
  description = excluded.description,
  icon        = excluded.icon,
  sort_order  = excluded.sort_order,
  features    = excluded.features,
  updated_at  = now();

-- ── Products ─────────────────────────────────────────────────
-- Linked to services by slug (resolved inline via subquery)

insert into public.products (sku, name, category, description, price_ksh, badge, emoji, rating, reviews, stock, service_id) values
  ('CAM-40100', 'UltraHD 4K AI Dome Camera',           'CCTV',          'AI Motion Detection · IR Night Vision · H.265+',          16900,  'NEW',  '📷', 4.8, 48,  74,  (select id from public.services where slug = 'cctv-surveillance')),
  ('CAM-40700', 'Hikvision 4MP PTZ Speed Dome',         'CCTV',          '30× Optical Zoom · H.265+ · IP67 Weatherproof',          44900,  null,   '🎥', 4.6, 38,  17,  (select id from public.services where slug = 'cctv-surveillance')),
  ('NVR-11000', '16-Channel 4K NVR Recorder',           'CCTV',          'H.265+ · Dual SATA · Remote Playback',                   45000,  null,   '🖥️', 4.7, 31,  42,  (select id from public.services where slug = 'cctv-surveillance')),
  ('ACC-20200', 'BioScan Pro X Face & Fingerprint',      'Access Control','Dual Authentication · TCP/IP · 3,000 User Capacity',     58500,  null,   '🔐', 4.6, 32,  38,  (select id from public.services where slug = 'access-control')),
  ('ACC-20800', 'RFID Card Reader Enterprise',           'Access Control','Wiegand 26/34 · Vandal-proof · IP65',                    12350,  null,   '💳', 4.2, 22,  88,  (select id from public.services where slug = 'access-control')),
  ('BIO-60600', 'Iris Recognition Terminal Pro',         'Biometric',     'Anti-Spoofing · IP65 · 10,000 User Capacity',            90900,  'NEW',  '👁️', 4.9, 12,   9,  (select id from public.services where slug = 'access-control')),
  ('LCK-30300', 'Keyless Entry Smart Lock V2',           'Alarms',        'Bluetooth 5.0 · App Control · Auto-Lock',                24600,  'SALE', '🔒', 4.5, 67,  55,  (select id from public.services where slug = 'alarm-systems')),
  ('ALM-40400', 'Wireless Smart Home Security Hub',      'Alarms',        '4G + WiFi · 128 Zone Support · Tamper Alert',            41700,  null,   '🚨', 4.7, 29,  21,  (select id from public.services where slug = 'alarm-systems')),
  ('FIR-90900', 'ProSeries 5000 Industrial Fire Alarm',  'Alarms',        '500-Point Addressable · BS5839 · Remote Reset',         115700,  'NEW',  '🔴', 4.9, 48,  14,  (select id from public.services where slug = 'alarm-systems')),
  ('SEN-77000', 'PIR Motion Sensor HD Wide-Angle',       'Sensors',       '12m Range · 110° FOV · Pet-Immune',                       3500,  null,   '🕵️', 4.4, 55, 112,  (select id from public.services where slug = 'alarm-systems')),
  ('NET-50500', 'PoE Network Switch 24-Port Gigabit',    'Networking',    '802.3af/at PoE+ · VLAN · Managed',                      11700,  null,   '📡', 4.3, 15,  63,  (select id from public.services where slug = 'networking')),
  ('RES-12000', 'Home Security Starter Kit',             'Residential',   '2× Cameras · Hub · 2 Sensors · App Ready',               32400,  'SALE', '🏠', 4.5, 84,  29,  (select id from public.services where slug = 'home-automation'))
on conflict (sku) do update set
  name        = excluded.name,
  category    = excluded.category,
  description = excluded.description,
  price_ksh   = excluded.price_ksh,
  badge       = excluded.badge,
  emoji       = excluded.emoji,
  rating      = excluded.rating,
  reviews     = excluded.reviews,
  stock       = excluded.stock,
  service_id  = excluded.service_id,
  updated_at  = now();
