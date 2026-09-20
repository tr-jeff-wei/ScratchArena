# ScratchArena (prototype)

A static HTML/CSS/JS prototype for ScratchArena — a gamified competitive learning platform for Scratch. No build step, no server, no framework: just plain files you can open directly or host on any static file host (GitHub Pages, S3, Netlify, etc).

## Structure

- `index.html` — dashboard: hero, stats, level grid
- `arena.html?level=<id>` — arena view: Scratch viewport placeholder, mission briefing HUD, live leaderboard
- `rankings.html` — per-level leaderboard tabs
- `css/style.css` — all styling, design tokens, and animations
- `js/data.js` — mock level and leaderboard data
- `js/extensionApi.js` — mock browser-extension → leaderboard data flow (integration hooks commented inline)
- `js/components.js` — shared UI renderers (navbar, footer, badges, leaderboard)
- `js/dashboard.js`, `js/arena.js`, `js/rankings.js` — per-page logic

## Running locally

Just open `index.html` in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Data connection

```sql

-- 1. Create the table for storing game session data
CREATE TABLE public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL,                  -- Unique ID of the player
    scratch_project_id TEXT NOT NULL,         -- Scratch Project ID (e.g. '104958302')
    score INTEGER NOT NULL DEFAULT 0,         -- Score achieved
    time_taken_seconds NUMERIC(10, 2) NOT NULL, -- Time taken (e.g., 45.50 seconds)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create basic policy for extension API access (Allows inserting records)
CREATE POLICY "Allow public insert" 
ON public.game_sessions 
FOR INSERT 
WITH CHECK (true);

-- 4. Create policy to allow reading scores (for leaderboards/website)
CREATE POLICY "Allow public read" 
ON public.game_sessions 
FOR SELECT 
USING (true);
```

- test data
```sql

INSERT INTO public.game_sessions (player_id, scratch_project_id, score, time_taken_seconds) VALUES
('player_42', 'proj_912', 450, 89.2),
('player_87', 'proj_304', 120, 142.5),
('player_15', 'proj_812', 980, 54.1),
('player_03', 'proj_912', 310, 110.8),
('player_61', 'proj_550', 50, 205.3),
('player_99', 'proj_304', 670, 78.4),
('player_24', 'proj_812', 820, 62.9),
('player_71', 'proj_912', 150, 180.0),
('player_38', 'proj_550', 490, 95.6),
('player_05', 'proj_304', 300, 134.1),
('player_82', 'proj_812', 1150, 48.7),
('player_19', 'proj_912', 720, 71.3),
('player_54', 'proj_550', 210, 160.2),
('player_91', 'proj_304', 530, 88.9),
('player_33', 'proj_812', 600, 102.4),
('player_08', 'proj_912', 90, 215.8),
('player_67', 'proj_550', 380, 125.0),
('player_12', 'proj_304', 850, 66.3),
('player_76', 'proj_812', 410, 118.7),
('player_49', 'proj_912', 1030, 51.5),
('player_22', 'proj_550', 180, 175.4),
('player_88', 'proj_304', 740, 79.1),
('player_31', 'proj_812', 290, 140.6),
('player_04', 'proj_912', 620, 84.3),
('player_65', 'proj_550', 510, 92.8),
('player_93', 'proj_304', 110, 198.2),
('player_17', 'proj_812', 940, 57.0),
('player_58', 'proj_912', 360, 130.5),
('player_29', 'proj_550', 270, 152.1),
('player_84', 'proj_304', 800, 69.8),
('player_10', 'proj_812', 470, 108.3),
('player_73', 'proj_912', 880, 60.4),
('player_46', 'proj_550', 140, 188.9),
('player_02', 'proj_304', 690, 75.2),
('player_95', 'proj_812', 1210, 42.1),
('player_37', 'proj_912', 230, 165.7),
('player_80', 'proj_550', 430, 114.0),
('player_21', 'proj_304', 580, 86.5),
('player_64', 'proj_812', 760, 73.9),
('player_11', 'proj_912', 340, 138.2),
('player_52', 'proj_550', 80, 222.6),
('player_97', 'proj_304', 920, 59.3),
('player_28', 'proj_812', 500, 99.1),
('player_75', 'proj_912', 170, 179.8),
('player_40', 'proj_550', 640, 81.7),
('player_06', 'proj_304', 260, 148.4),
('player_89', 'proj_812', 1090, 46.8),
('player_35', 'proj_912', 400, 121.3),
('player_18', 'proj_550', 310, 136.9),
('player_62', 'proj_304', 830, 67.2),
('player_94', 'proj_812', 220, 159.0),
('player_27', 'proj_912', 750, 70.1),
('player_81', 'proj_550', 480, 105.6),
('player_44', 'proj_304', 130, 191.4),
('player_09', 'proj_812', 870, 63.5),
('player_70', 'proj_912', 280, 144.2),
('player_53', 'proj_550', 560, 87.8),
('player_98', 'proj_304', 390, 127.6),
('player_16', 'proj_812', 1010, 53.4),
('player_63', 'proj_912', 60, 230.1),
('player_36', 'proj_550', 710, 74.8),
('player_85', 'proj_304', 460, 111.5),
('player_20', 'proj_812', 630, 83.0),
('player_78', 'proj_912', 190, 171.9),
('player_51', 'proj_550', 350, 132.7),
('player_07', 'proj_304', 960, 55.6),
('player_92', 'proj_812', 250, 154.3),
('player_39', 'proj_912', 790, 68.4),
('player_14', 'proj_550', 120, 195.0),
('player_68', 'proj_304', 540, 91.2),
('player_30', 'proj_812', 1140, 44.9),
('player_86', 'proj_912', 420, 117.1),
('player_47', 'proj_550', 220, 163.8),
('player_01', 'proj_304', 680, 77.5),
('player_74', 'proj_812', 330, 139.4),
('player_59', 'proj_912', 900, 58.2),
('player_26', 'proj_550', 160, 183.6),
('player_90', 'proj_304', 770, 72.0),
('player_43', 'proj_812', 520, 96.7),
('player_13', 'proj_912', 240, 161.5),
('player_79', 'proj_550', 660, 82.9),
('player_32', 'proj_304', 100, 208.4),
('player_66', 'proj_812', 840, 65.1),
('player_96', 'proj_912', 370, 128.9),
('player_25', 'proj_550', 440, 112.3),
('player_83', 'proj_304', 590, 85.0),
('player_50', 'proj_812', 1060, 49.2),
('player_23', 'proj_912', 150, 186.7),
('player_72', 'proj_550', 290, 147.1),
('player_48', 'proj_304', 730, 76.8),
('player_05', 'proj_812', 410, 119.5),
('player_69', 'proj_912', 860, 61.2),
('player_34', 'proj_550', 200, 169.3),
('player_91', 'proj_304', 610, 84.0),
('player_15', 'proj_812', 1180, 41.5),
('player_57', 'proj_912', 300, 135.8),
('player_28', 'proj_550', 470, 107.2),
('player_82', 'proj_304', 880, 64.9),
('player_41', 'proj_812', 130, 192.6),
('player_10', 'proj_912', 950, 56.1);

```


