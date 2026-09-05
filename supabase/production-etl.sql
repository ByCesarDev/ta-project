-- ==============================================================================
-- TOTALANIME 2.0 - PRODUCTION ETL RELATIONAL DATASET (CLEAN & ZERO-FIXTURES)
-- Archivo: supabase/production-etl.sql
--
-- ADVERTENCIA DE SEGURIDAD Y PRE-REQUISITO:
-- Este archivo es para el despliegue de datos en PRODUCCIÓN.
-- NUNCA toca ni inserta en auth.users (evita duplicidad de claves y UUIDs fakes).
-- Requiere que 'public.migration_user_map' ya esté poblado mediante:
--   npm run migrate:users
-- Todas las claves foráneas (claimed_by, created_by, user_id) se resuelven
-- dinámicamente desde migration_user_map garantizando integridad referencial.
-- ==============================================================================

-- ========================================================
-- 1. CATÁLOGO DE GÉNEROS (public.genres) - 19 géneros
-- ========================================================
INSERT INTO public.genres (id, name, slug) VALUES
(1, 'Action', 'action'),
(2, 'Adventure', 'adventure'),
(3, 'Comedy', 'comedy'),
(4, 'Drama', 'drama'),
(5, 'Ecchi', 'ecchi'),
(6, 'Fantasy', 'fantasy'),
(7, 'Hentai', 'hentai'),
(8, 'Horror', 'horror'),
(9, 'Mahou Shoujo', 'mahou-shoujo'),
(10, 'Mecha', 'mecha'),
(11, 'Music', 'music'),
(12, 'Mystery', 'mystery'),
(13, 'Psychological', 'psychological'),
(14, 'Romance', 'romance'),
(15, 'Sci-Fi', 'sci-fi'),
(16, 'Slice of Life', 'slice-of-life'),
(17, 'Sports', 'sports'),
(18, 'Supernatural', 'supernatural'),
(19, 'Thriller', 'thriller')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 2. CATÁLOGO DE AVATARES PREDEFINIDOS (public.avatars) - 13 avatares
-- ========================================================
INSERT INTO public.avatars (id, filename, is_default, created_at, updated_at) VALUES
(1, 'default-avatar.png', true, '2025-09-24 20:16:42+00', '2025-09-24 20:16:42+00'),
(16, 'user-1.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(17, 'user-2.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(18, 'user-3.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(19, 'user-4.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(20, 'user-5.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(21, 'user-6.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(22, 'user-7.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(23, 'user-8.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(24, 'user-9.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(25, 'user-10.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(26, 'user-11.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00'),
(27, 'user-12.jpeg', false, '2025-09-24 22:49:27+00', '2025-09-24 22:49:27+00')
ON CONFLICT (id) DO NOTHING;


-- ========================================================
-- 6. CATÁLOGO DE ANIMES (public.animes) - 17 animes (IDs 66-82)
-- ========================================================
INSERT INTO public.animes (id, name, title_romaji, title_english, title_native, cover_image, banner_image, status, episodes, description, anilist_id, claimed_by, claimed_at, season_year, format, slug, air_day, air_time, air_timezone, start_date, end_date, views_count, created_at, updated_at) VALUES
(66, 'Attack on Titan', 'Shingeki no Kyojin', 'Attack on Titan', '進撃の巨人', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg', 'FINISHED', 25, 'Several hundred years ago, humans were nearly exterminated by titans. Titans are typically several stories tall, seem to have no intelligence, devour human beings and, worst of all, seem to do it for the pleasure rather than as a food source. A small percentage of humanity survived by walling themselves in a city protected by extremely high walls, even taller than the biggest of titans.
Flash forward to the present and the city has not seen a titan in over 100 years. Teenage boy Eren and his foster sister Mikasa witness something horrific as the city walls are destroyed by a colossal titan that appears out of thin air. As the smaller titans flood the city, the two kids watch in horror as their mother is eaten alive. Eren vows that he will murder every single titan and take revenge for all of mankind.
(Source: MangaHelpers) ', 16498, NULL, NULL, 2013, 'TV', 'attack-on-titan', NULL, NULL, 'Asia/Tokyo', '2013-04-07', '2013-09-28', 0, '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(67, 'Demon Slayer: Kimetsu no Yaiba', 'Kimetsu no Yaiba', 'Demon Slayer: Kimetsu no Yaiba', '鬼滅の刃', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg', 'FINISHED', 26, 'It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. Though devastated by this grim reality, Tanjiro resolves to become a “demon slayer” so that he can turn his sister back into a human, and kill the demon that massacred his family.

(Source: Crunchyroll)', 101922, NULL, NULL, 2019, 'TV', 'demon-slayer-kimetsu-no-yaiba', NULL, NULL, 'Asia/Tokyo', '2019-04-06', '2019-09-28', 0, '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(68, 'TOUGEN ANKI', 'Tougen Anki', 'TOUGEN ANKI', '桃源暗鬼', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177474-oHil1yLWldfl.jpg', NULL, 'RELEASING', 24, 'The bloodlines of “Oni” and “Momotarou” have been passed down among certain humans for generations.

Long ago, the Oni, aware of their own ferocity, lived in seclusion. However, their peace was shattered by an invasion led by Momotarou.
Over thousands of years, these two factions formed the “Momotarou Agency” and the “Oni Agency,” respectively, and have been locked in conflict ever since.

The protagonist, Shiki Ichinose, suddenly learns of his Oni lineage following an unexpected attack by Momotarou. This revelation sets Shiki on a path to discover the destiny that lies within his blood — a meeting with the Oni dwelling within him.

—A new generation of dark heroics begins here in this tale of demons!


(Source: Official Site)', 177474, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:50+00', 2025, 'TV', 'tougen-anki', 5, '23:00:00', 'Asia/Tokyo', '2025-07-11', NULL, 0, '2025-09-04 01:48:42+00', '2025-09-04 01:48:50+00'),
(69, 'Death Note', 'DEATH NOTE', 'Death Note', 'DEATH NOTE', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg', 'FINISHED', 37, 'Light Yagami is a genius high school student who is about to learn about life through a book of death. When a bored shinigami, a God of Death, named Ryuk drops a black notepad called a Death Note, Light receives power over life and death with the stroke of a pen. Determined to use this dark gift for the best, Light sets out to rid the world of evil… namely, the people he believes to be evil. Should anyone hold such power?

The consequences of Light’s actions will set the world ablaze.

(Source: Viz Media)', 1535, NULL, NULL, 2006, 'TV', 'death-note', NULL, NULL, 'Asia/Tokyo', '2006-10-04', '2007-06-27', 0, '2025-09-04 01:53:31+00', '2025-09-04 01:53:31+00'),
(70, 'Tokyo Ghoul', 'Tokyo Ghoul', 'Tokyo Ghoul', '東京喰種 トーキョーグール', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/b20605-k665mVkSug8D.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20605-RCJ7M71zLmrh.jpg', 'FINISHED', 12, 'The suspense horror/dark fantasy story is set in Tokyo, which is haunted by mysterious ', 20605, NULL, NULL, 2014, 'TV', 'tokyo-ghoul', NULL, NULL, 'Asia/Tokyo', '2014-07-04', '2014-09-19', 0, '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(71, 'One-Punch Man', 'One Punch Man', 'One-Punch Man', 'ワンパンマン', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-sHb9zUZFsHe1.jpg', 'FINISHED', 12, 'Saitama has a rather peculiar hobby, being a superhero, but despite his heroic deeds and superhuman abilities, a shadow looms over his life. He''s become much too powerful, to the point that every opponent ends up defeated with a single punch.

The lack of challenge has driven him into a state of apathy, as he watches his life pass by having lost all enthusiasm, at least until he''s unwillingly thrust in the role of being a mentor to the young and revenge-driven Genos.   

', 21087, NULL, NULL, 2015, 'TV', 'one-punch-man', NULL, NULL, 'Asia/Tokyo', '2015-10-05', '2015-12-21', 0, '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(72, 'Hunter x Hunter (2011)', 'HUNTER×HUNTER (2011)', 'Hunter x Hunter (2011)', 'HUNTER×HUNTER (2011)', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-y5gsT1hoHuHw.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-8WkkTZ6duKpq.jpg', 'FINISHED', 148, 'A new adaption of the manga of the same name by Togashi Yoshihiro.
A Hunter is one who travels the world doing all sorts of dangerous tasks. From capturing criminals to searching deep within uncharted lands for any lost treasures. Gon is a young boy whose father disappeared long ago, being a Hunter. He believes if he could also follow his father''s path, he could one day reunite with him.
After becoming 12, Gon leaves his home and takes on the task of entering the Hunter exam, notorious for its low success rate and high probability of death to become an official Hunter. He befriends the revenge-driven Kurapika, the doctor-to-be Leorio and the rebellious ex-assassin Killua in the exam, with their friendship prevailing throughout the many trials and threats they come upon taking on the dangerous career of a Hunter.', 11061, NULL, NULL, 2011, 'TV', 'hunter-x-hunter-2011', NULL, NULL, 'Asia/Tokyo', '2011-10-02', '2014-09-24', 0, '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(73, 'Sword Art Online', 'Sword Art Online', 'Sword Art Online', 'ソードアート・オンライン', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-SxYDUzdr9rh2.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11757-TlEEV9weG4Ag.jpg', 'FINISHED', 25, 'In the near future, a Virtual Reality Massive Multiplayer Online Role-Playing Game (VRMMORPG) called Sword Art Online has been released where players control their avatars with their bodies using a piece of technology called Nerve Gear. One day, players discover they cannot log out, as the game creator is holding them captive unless they reach the 100th floor of the game''s tower and defeat the final boss. However, if they die in the game, they die in real life. Their struggle for survival starts now...
(Source: Crunchyroll)', 11757, NULL, NULL, 2012, 'TV', 'sword-art-online', NULL, NULL, 'Asia/Tokyo', '2012-07-08', '2012-12-23', 0, '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(74, 'Lord of Mysteries', 'Guimi Zhi Zhu', 'Lord of Mysteries', '诡秘之主', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx137667-zHFOF6qbpksP.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/137667-AhUoT3NFgbif.jpg', 'FINISHED', 13, 'In a Victorian world of steam, dreadnoughts, and occult horrors, Zhou Mingrui awakens as Klein Moretti. He walks a razor’s edge between light and darkness, entangled with warring Churches. This is the legend of unlimited potential…and unspeakable danger.

(Source: Crunchyroll)', 137667, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:37:06+00', NULL, 'ONA', 'lord-of-mysteries', NULL, NULL, 'Asia/Tokyo', '2025-06-28', '2025-09-13', 0, '2025-09-24 17:36:56+00', '2025-09-24 17:37:06+00'),
(75, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability', 'Tensei Shitara Dai Nana Ouji Dattanode, Kimamani Majutsu wo Kiwamemasu', 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability', '転生したら第七王子だったので、気ままに魔術を極めます', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx156415-zwP9deA786S1.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/156415-9pgnWbRE3ERY.jpg', 'FINISHED', 12, 'The qualities valued most in the study of magic are bloodline, aptitude, and effort. There was one sorcerer who, despite his deep love for magic, was born a commoner and thus lacked the bloodline and aptitude for it. As he died an unnatural death, he wished he had studied magic more while he had the chance. Then, he was reincarnated as Lloyd, the seventh prince of the Kingdom of Saloum and one blessed with a strong magical bloodline. Reborn with all his memories intact, along with the perfect bloodline and immense talent, he was determined to enjoy his new life, using his extraordinary magical abilities to master the study of magic that was beyond his reach in his previous life!


(Source: Crunchyroll)', 156415, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:45+00', 2024, 'TV', 'i-was-reincarnated-as-the-7th-prince-so-i-can-take-my-time-perfecting-my-magical-ability', NULL, NULL, 'Asia/Tokyo', '2024-04-02', '2024-06-18', 0, '2025-09-24 21:59:20+00', '2025-09-24 21:59:45+00'),
(76, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2', 'Tensei Shitara Dai Nana Ouji Dattanode, Kimamani Majutsu wo Kiwamemasu 2nd Season', 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2', '転生したら第七王子だったので、気ままに魔術を極めます 第2期', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178090-1OOScJqXLjRd.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/178090-EgKftuHoDJB7.jpg', 'FINISHED', 12, 'The second season of Tensei Shitara Dai Nana Ouji Dattanode, Kimamani Majutsu wo Kiwamemasu.

After a victorious battle against Guisarme in the Lordost region, Lloyd’s pursuit of magic knows no bounds. His next goal? Holy Magic! To learn this sacred art, Lloyd and his companions visit a church, but what awaits them there…?
(Source: I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Official Site)', 178090, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:48+00', 2025, 'TV', 'i-was-reincarnated-as-the-7th-prince-so-i-can-take-my-time-perfecting-my-magical-ability-season-2', NULL, NULL, 'Asia/Tokyo', '2025-07-10', '2025-09-25', 0, '2025-09-24 21:59:31+00', '2025-09-24 21:59:48+00'),
(77, 'The Seven Deadly Sins', 'Nanatsu no Taizai', 'The Seven Deadly Sins', '七つの大罪', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20789-Ma5ouSYPkru9.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20789-qwG9GcxIrmVE.jpg', 'FINISHED', 24, 'When they were accused of trying to overthrow the monarchy, the feared warriors the Seven Deadly Sins were sent into exile. Princess Elizabeth discovers the truth - the Sins were framed by the king''s guard, the Holy Knights - too late to prevent them from assassinating her father and seizing the throne!
Now the princess is on the run, seeking the Sins to help her reclaim the kingdom. But the first Sin she meets, Meliodas, is a little innkeeper with a talking pig. He doesn''t even have a real sword! Have the legends of the Sins'' strength been exaggerated?

(Source: Anime News Network)', 20789, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:32+00', 2014, 'TV', 'the-seven-deadly-sins', NULL, NULL, 'Asia/Tokyo', '2014-10-05', '2015-03-29', 0, '2025-09-26 04:32:11+00', '2025-09-26 04:32:32+00'),
(78, 'JUJUTSU KAISEN', 'Jujutsu Kaisen', 'JUJUTSU KAISEN', '呪術廻戦', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx113415-LHBAeoZDIsnF.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg', 'FINISHED', 24, 'A boy fights... for ', 113415, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-10-16 00:42:48+00', 2020, 'TV', 'jujutsu-kaisen', NULL, NULL, 'Asia/Tokyo', '2020-10-03', '2021-03-27', 0, '2025-09-26 05:23:59+00', '2025-10-16 00:42:48+00'),
(79, 'My Hero Academia', 'Boku no Hero Academia', 'My Hero Academia', '僕のヒーローアカデミア', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21459-nYh85uj2Fuwr.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21459-yeVkolGKdGUV.jpg', 'FINISHED', 13, 'What would the world be like if 80 percent of the population manifested extraordinary superpowers called “Quirks” at age four? Heroes and villains would be battling it out everywhere! Becoming a hero would mean learning to use your power, but where would you go to study? U.A. High''s Hero Program of course! But what would you do if you were one of the 20 percent who were born Quirkless?

Middle school student Izuku Midoriya wants to be a hero more than anything, but he hasn''t got an ounce of power in him. With no chance of ever getting into the prestigious U.A. High School for budding heroes, his life is looking more and more like a dead end. Then an encounter with All Might, the greatest hero of them all gives him a chance to change his destiny…

(Source: Viz Media)', 21459, NULL, NULL, 2016, 'TV', 'my-hero-academia', NULL, NULL, 'Asia/Tokyo', '2016-04-03', '2016-06-26', 0, '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(80, 'Attack on Titan Season 2', 'Shingeki no Kyojin Season 2', 'Attack on Titan Season 2', '進撃の巨人 Season２', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx20958-HuFJyr54Mmir.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/20958-Y7eQdz9VENBD.jpg', 'FINISHED', 12, 'Eren Jaeger swore to wipe out every last Titan, but in a battle for his life he wound up becoming the thing he hates most. With his new powers, he fights for humanity''s freedom facing the monsters that threaten his home. After a bittersweet victory against the Female Titan, Eren finds no time to rest—a horde of Titans is approaching Wall Rose and the battle for humanity continues!

(Source: Funimation)', 20958, NULL, NULL, 2017, 'TV', 'attack-on-titan-season-2', NULL, NULL, 'Asia/Tokyo', '2017-04-01', '2017-06-17', 0, '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(81, 'Fullmetal Alchemist: Brotherhood', 'Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST', 'Fullmetal Alchemist: Brotherhood', '鋼の錬金術師 FULLMETAL ALCHEMIST', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx5114-nSWCgQlmOMtj.jpg', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg', 'FINISHED', 64, '\"In order for something to be obtained, something of equal value must be lost.\"

Alchemy is bound by this Law of Equivalent Exchange—something the young brothers Edward and Alphonse Elric only realize after attempting human transmutation: the one forbidden act of alchemy. They pay a terrible price for their transgression—Edward loses his left leg, Alphonse his physical body. It is only by the desperate sacrifice of Edward''s right arm that he is able to affix Alphonse''s soul to a suit of armor. Devastated and alone, it is the hope that they would both eventually return to their original bodies that gives Edward the inspiration to obtain metal limbs called \"automail\" and become a state alchemist, the Fullmetal Alchemist.

Three years of searching later, the brothers seek the Philosopher''s Stone, a mythical relic that allows an alchemist to overcome the Law of Equivalent Exchange. Even with military allies Colonel Roy Mustang, Lieutenant Riza Hawkeye, and Lieutenant Colonel Maes Hughes on their side, the brothers find themselves caught up in a nationwide conspiracy that leads them not only to the true nature of the elusive Philosopher''s Stone, but their country''s murky history as well. In between finding a serial killer and racing against time, Edward and Alphonse must ask themselves if what they are doing will make them human again... or take away their humanity.

(Source: MAL Rewrite)', 5114, NULL, NULL, 2009, 'TV', 'fullmetal-alchemist-brotherhood', NULL, NULL, 'Asia/Tokyo', '2009-04-05', '2010-07-04', 0, '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(82, 'Your Name.', 'Kimi no Na wa.', 'Your Name.', '君の名は。', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21519-SUo3ZQuCbYhJ.png', 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21519-1ayMXgNlmByb.jpg', 'FINISHED', 1, 'Mitsuha Miyamizu, a high school girl, yearns to live the life of a boy in the bustling city of Tokyo—a dream that stands in stark contrast to her present life in the countryside. Meanwhile in the city, Taki Tachibana lives a busy life as a high school student while juggling his part-time job and hopes for a future in architecture.

One day, Mitsuha awakens in a room that is not her own and suddenly finds herself living the dream life in Tokyo—but in Taki''s body! Elsewhere, Taki finds himself living Mitsuha''s life in the humble countryside. In pursuit of an answer to this strange phenomenon, they begin to search for one another.

Kimi no Na wa. revolves around Mitsuha and Taki''s actions, which begin to have a dramatic impact on each other''s lives, weaving them into a fabric held together by fate and circumstance.

(Source: MAL Rewrite)', 21519, NULL, NULL, 2016, 'MOVIE', 'your-name', NULL, NULL, 'Asia/Tokyo', '2016-08-26', '2016-08-26', 0, '2025-09-26 05:34:28+00', '2025-09-26 05:34:28+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 7. RELACIÓN ANIME - GÉNEROS (public.anime_genres)
-- ========================================================
INSERT INTO public.anime_genres (anime_id, genre_id) VALUES
(66, 1),
(67, 1),
(68, 1),
(70, 1),
(71, 1),
(72, 1),
(73, 1),
(74, 1),
(75, 1),
(76, 1),
(77, 1),
(78, 1),
(79, 1),
(80, 1),
(81, 1),
(67, 2),
(72, 2),
(73, 2),
(75, 2),
(76, 2),
(77, 2),
(79, 2),
(81, 2),
(71, 3),
(77, 3),
(79, 3),
(66, 4),
(67, 4),
(70, 4),
(74, 4),
(78, 4),
(80, 4),
(81, 4),
(82, 4),
(77, 5),
(66, 6),
(67, 6),
(72, 6),
(73, 6),
(74, 6),
(75, 6),
(76, 6),
(77, 6),
(80, 6),
(81, 6),
(70, 8),
(66, 12),
(68, 12),
(69, 12),
(70, 12),
(74, 12),
(80, 12),
(69, 13),
(70, 13),
(73, 14),
(82, 14),
(71, 15),
(76, 16),
(67, 18),
(68, 18),
(69, 18),
(70, 18),
(71, 18),
(74, 18),
(77, 18),
(78, 18),
(82, 18),
(69, 19),
(74, 19)
ON CONFLICT (anime_id, genre_id) DO NOTHING;

-- ========================================================
-- 8. TABLA DE EPISODIOS (public.episodes) - 484 episodios (IDs 2038-2521)
-- ========================================================
INSERT INTO public.episodes (id, anime_id, episode_number, title, description, duration, thumbnail, air_at, status, views, created_by, created_at, updated_at) VALUES
(2038, 66, 1, 'Attack on Titan - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2039, 66, 2, 'Attack on Titan - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2040, 66, 3, 'Attack on Titan - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2041, 66, 4, 'Attack on Titan - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2042, 66, 5, 'Attack on Titan - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2043, 66, 6, 'Attack on Titan - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2044, 66, 7, 'Attack on Titan - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2045, 66, 8, 'Attack on Titan - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2046, 66, 9, 'Attack on Titan - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2047, 66, 10, 'Attack on Titan - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2048, 66, 11, 'Attack on Titan - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2049, 66, 12, 'Attack on Titan - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2050, 66, 13, 'Attack on Titan - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2051, 66, 14, 'Attack on Titan - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2052, 66, 15, 'Attack on Titan - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2053, 66, 16, 'Attack on Titan - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2054, 66, 17, 'Attack on Titan - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2055, 66, 18, 'Attack on Titan - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2056, 66, 19, 'Attack on Titan - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2057, 66, 20, 'Attack on Titan - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2058, 66, 21, 'Attack on Titan - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2059, 66, 22, 'Attack on Titan - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2060, 66, 23, 'Attack on Titan - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2061, 66, 24, 'Attack on Titan - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2062, 66, 25, 'Attack on Titan - Episodio 25', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:49:32+00', '2025-09-04 00:49:32+00'),
(2063, 67, 1, 'Demon Slayer: Kimetsu no Yaiba - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2064, 67, 2, 'Demon Slayer: Kimetsu no Yaiba - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2065, 67, 3, 'Demon Slayer: Kimetsu no Yaiba - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2066, 67, 4, 'Demon Slayer: Kimetsu no Yaiba - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2067, 67, 5, 'Demon Slayer: Kimetsu no Yaiba - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2068, 67, 6, 'Demon Slayer: Kimetsu no Yaiba - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2069, 67, 7, 'Demon Slayer: Kimetsu no Yaiba - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2070, 67, 8, 'Demon Slayer: Kimetsu no Yaiba - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2071, 67, 9, 'Demon Slayer: Kimetsu no Yaiba - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2072, 67, 10, 'Demon Slayer: Kimetsu no Yaiba - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2073, 67, 11, 'Demon Slayer: Kimetsu no Yaiba - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2074, 67, 12, 'Demon Slayer: Kimetsu no Yaiba - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2075, 67, 13, 'Demon Slayer: Kimetsu no Yaiba - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2076, 67, 14, 'Demon Slayer: Kimetsu no Yaiba - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2077, 67, 15, 'Demon Slayer: Kimetsu no Yaiba - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2078, 67, 16, 'Demon Slayer: Kimetsu no Yaiba - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2079, 67, 17, 'Demon Slayer: Kimetsu no Yaiba - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2080, 67, 18, 'Demon Slayer: Kimetsu no Yaiba - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2081, 67, 19, 'Demon Slayer: Kimetsu no Yaiba - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2082, 67, 20, 'Demon Slayer: Kimetsu no Yaiba - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2083, 67, 21, 'Demon Slayer: Kimetsu no Yaiba - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2084, 67, 22, 'Demon Slayer: Kimetsu no Yaiba - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2085, 67, 23, 'Demon Slayer: Kimetsu no Yaiba - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2086, 67, 24, 'Demon Slayer: Kimetsu no Yaiba - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2087, 67, 25, 'Demon Slayer: Kimetsu no Yaiba - Episodio 25', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2088, 67, 26, 'Demon Slayer: Kimetsu no Yaiba - Episodio 26', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 00:57:07+00', '2025-09-04 00:57:07+00'),
(2089, 68, 1, 'TOUGEN ANKI - Episodio 1', '', NULL, NULL, NULL, 'available', 8, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:57:56+00'),
(2090, 68, 2, 'TOUGEN ANKI - Episodio 2', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:22+00'),
(2091, 68, 3, 'TOUGEN ANKI - Episodio 3', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:26+00'),
(2092, 68, 4, 'TOUGEN ANKI - Episodio 4', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:33+00'),
(2093, 68, 5, 'TOUGEN ANKI - Episodio 5', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:39+00'),
(2094, 68, 6, 'TOUGEN ANKI - Episodio 6', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:43+00'),
(2095, 68, 7, 'TOUGEN ANKI - Episodio 7', '', NULL, NULL, NULL, 'available', 2, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:48+00'),
(2096, 68, 8, 'TOUGEN ANKI - Episodio 8', '', NULL, NULL, NULL, 'available', 7, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:49:52+00'),
(2097, 68, 9, 'TOUGEN ANKI - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:42+00', '2025-09-04 01:48:42+00'),
(2098, 68, 10, 'TOUGEN ANKI - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2099, 68, 11, 'TOUGEN ANKI - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2100, 68, 12, 'TOUGEN ANKI - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2101, 68, 13, 'TOUGEN ANKI - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2102, 68, 14, 'TOUGEN ANKI - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2103, 68, 15, 'TOUGEN ANKI - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2104, 68, 16, 'TOUGEN ANKI - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2105, 68, 17, 'TOUGEN ANKI - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2106, 68, 18, 'TOUGEN ANKI - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2107, 68, 19, 'TOUGEN ANKI - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2108, 68, 20, 'TOUGEN ANKI - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2109, 68, 21, 'TOUGEN ANKI - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2110, 68, 22, 'TOUGEN ANKI - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2111, 68, 23, 'TOUGEN ANKI - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2112, 68, 24, 'TOUGEN ANKI - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:48:43+00', '2025-09-04 01:48:43+00'),
(2113, 69, 1, 'Death Note - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:31+00', '2025-09-04 01:53:31+00'),
(2114, 69, 2, 'Death Note - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2115, 69, 3, 'Death Note - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2116, 69, 4, 'Death Note - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2117, 69, 5, 'Death Note - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2118, 69, 6, 'Death Note - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2119, 69, 7, 'Death Note - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2120, 69, 8, 'Death Note - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2121, 69, 9, 'Death Note - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2122, 69, 10, 'Death Note - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2123, 69, 11, 'Death Note - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2124, 69, 12, 'Death Note - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2125, 69, 13, 'Death Note - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2126, 69, 14, 'Death Note - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2127, 69, 15, 'Death Note - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2128, 69, 16, 'Death Note - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2129, 69, 17, 'Death Note - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2130, 69, 18, 'Death Note - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2131, 69, 19, 'Death Note - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2132, 69, 20, 'Death Note - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2133, 69, 21, 'Death Note - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2134, 69, 22, 'Death Note - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2135, 69, 23, 'Death Note - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2136, 69, 24, 'Death Note - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2137, 69, 25, 'Death Note - Episodio 25', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2138, 69, 26, 'Death Note - Episodio 26', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2139, 69, 27, 'Death Note - Episodio 27', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2140, 69, 28, 'Death Note - Episodio 28', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2141, 69, 29, 'Death Note - Episodio 29', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2142, 69, 30, 'Death Note - Episodio 30', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2143, 69, 31, 'Death Note - Episodio 31', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2144, 69, 32, 'Death Note - Episodio 32', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2145, 69, 33, 'Death Note - Episodio 33', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2146, 69, 34, 'Death Note - Episodio 34', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2147, 69, 35, 'Death Note - Episodio 35', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2148, 69, 36, 'Death Note - Episodio 36', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2149, 69, 37, 'Death Note - Episodio 37', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:32+00', '2025-09-04 01:53:32+00'),
(2150, 70, 1, 'Tokyo Ghoul - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2151, 70, 2, 'Tokyo Ghoul - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2152, 70, 3, 'Tokyo Ghoul - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2153, 70, 4, 'Tokyo Ghoul - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2154, 70, 5, 'Tokyo Ghoul - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2155, 70, 6, 'Tokyo Ghoul - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2156, 70, 7, 'Tokyo Ghoul - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2157, 70, 8, 'Tokyo Ghoul - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2158, 70, 9, 'Tokyo Ghoul - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2159, 70, 10, 'Tokyo Ghoul - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2160, 70, 11, 'Tokyo Ghoul - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2161, 70, 12, 'Tokyo Ghoul - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:38+00', '2025-09-04 01:53:38+00'),
(2162, 71, 1, 'One-Punch Man - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2163, 71, 2, 'One-Punch Man - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2164, 71, 3, 'One-Punch Man - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2165, 71, 4, 'One-Punch Man - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2166, 71, 5, 'One-Punch Man - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2167, 71, 6, 'One-Punch Man - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2168, 71, 7, 'One-Punch Man - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2169, 71, 8, 'One-Punch Man - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2170, 71, 9, 'One-Punch Man - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2171, 71, 10, 'One-Punch Man - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2172, 71, 11, 'One-Punch Man - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2173, 71, 12, 'One-Punch Man - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:42+00', '2025-09-04 01:53:42+00'),
(2174, 72, 1, 'Hunter x Hunter (2011) - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2175, 72, 2, 'Hunter x Hunter (2011) - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2176, 72, 3, 'Hunter x Hunter (2011) - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2177, 72, 4, 'Hunter x Hunter (2011) - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2178, 72, 5, 'Hunter x Hunter (2011) - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2179, 72, 6, 'Hunter x Hunter (2011) - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2180, 72, 7, 'Hunter x Hunter (2011) - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2181, 72, 8, 'Hunter x Hunter (2011) - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2182, 72, 9, 'Hunter x Hunter (2011) - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2183, 72, 10, 'Hunter x Hunter (2011) - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2184, 72, 11, 'Hunter x Hunter (2011) - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2185, 72, 12, 'Hunter x Hunter (2011) - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2186, 72, 13, 'Hunter x Hunter (2011) - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2187, 72, 14, 'Hunter x Hunter (2011) - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2188, 72, 15, 'Hunter x Hunter (2011) - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2189, 72, 16, 'Hunter x Hunter (2011) - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2190, 72, 17, 'Hunter x Hunter (2011) - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2191, 72, 18, 'Hunter x Hunter (2011) - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2192, 72, 19, 'Hunter x Hunter (2011) - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2193, 72, 20, 'Hunter x Hunter (2011) - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2194, 72, 21, 'Hunter x Hunter (2011) - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2195, 72, 22, 'Hunter x Hunter (2011) - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2196, 72, 23, 'Hunter x Hunter (2011) - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2197, 72, 24, 'Hunter x Hunter (2011) - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2198, 72, 25, 'Hunter x Hunter (2011) - Episodio 25', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2199, 72, 26, 'Hunter x Hunter (2011) - Episodio 26', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2200, 72, 27, 'Hunter x Hunter (2011) - Episodio 27', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2201, 72, 28, 'Hunter x Hunter (2011) - Episodio 28', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2202, 72, 29, 'Hunter x Hunter (2011) - Episodio 29', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2203, 72, 30, 'Hunter x Hunter (2011) - Episodio 30', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2204, 72, 31, 'Hunter x Hunter (2011) - Episodio 31', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2205, 72, 32, 'Hunter x Hunter (2011) - Episodio 32', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2206, 72, 33, 'Hunter x Hunter (2011) - Episodio 33', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2207, 72, 34, 'Hunter x Hunter (2011) - Episodio 34', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2208, 72, 35, 'Hunter x Hunter (2011) - Episodio 35', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2209, 72, 36, 'Hunter x Hunter (2011) - Episodio 36', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2210, 72, 37, 'Hunter x Hunter (2011) - Episodio 37', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2211, 72, 38, 'Hunter x Hunter (2011) - Episodio 38', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2212, 72, 39, 'Hunter x Hunter (2011) - Episodio 39', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2213, 72, 40, 'Hunter x Hunter (2011) - Episodio 40', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2214, 72, 41, 'Hunter x Hunter (2011) - Episodio 41', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2215, 72, 42, 'Hunter x Hunter (2011) - Episodio 42', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2216, 72, 43, 'Hunter x Hunter (2011) - Episodio 43', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2217, 72, 44, 'Hunter x Hunter (2011) - Episodio 44', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2218, 72, 45, 'Hunter x Hunter (2011) - Episodio 45', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2219, 72, 46, 'Hunter x Hunter (2011) - Episodio 46', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2220, 72, 47, 'Hunter x Hunter (2011) - Episodio 47', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2221, 72, 48, 'Hunter x Hunter (2011) - Episodio 48', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2222, 72, 49, 'Hunter x Hunter (2011) - Episodio 49', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2223, 72, 50, 'Hunter x Hunter (2011) - Episodio 50', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2224, 72, 51, 'Hunter x Hunter (2011) - Episodio 51', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2225, 72, 52, 'Hunter x Hunter (2011) - Episodio 52', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2226, 72, 53, 'Hunter x Hunter (2011) - Episodio 53', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2227, 72, 54, 'Hunter x Hunter (2011) - Episodio 54', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2228, 72, 55, 'Hunter x Hunter (2011) - Episodio 55', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2229, 72, 56, 'Hunter x Hunter (2011) - Episodio 56', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2230, 72, 57, 'Hunter x Hunter (2011) - Episodio 57', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2231, 72, 58, 'Hunter x Hunter (2011) - Episodio 58', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2232, 72, 59, 'Hunter x Hunter (2011) - Episodio 59', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2233, 72, 60, 'Hunter x Hunter (2011) - Episodio 60', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2234, 72, 61, 'Hunter x Hunter (2011) - Episodio 61', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2235, 72, 62, 'Hunter x Hunter (2011) - Episodio 62', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2236, 72, 63, 'Hunter x Hunter (2011) - Episodio 63', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2237, 72, 64, 'Hunter x Hunter (2011) - Episodio 64', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2238, 72, 65, 'Hunter x Hunter (2011) - Episodio 65', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2239, 72, 66, 'Hunter x Hunter (2011) - Episodio 66', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2240, 72, 67, 'Hunter x Hunter (2011) - Episodio 67', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2241, 72, 68, 'Hunter x Hunter (2011) - Episodio 68', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2242, 72, 69, 'Hunter x Hunter (2011) - Episodio 69', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2243, 72, 70, 'Hunter x Hunter (2011) - Episodio 70', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2244, 72, 71, 'Hunter x Hunter (2011) - Episodio 71', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2245, 72, 72, 'Hunter x Hunter (2011) - Episodio 72', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2246, 72, 73, 'Hunter x Hunter (2011) - Episodio 73', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2247, 72, 74, 'Hunter x Hunter (2011) - Episodio 74', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2248, 72, 75, 'Hunter x Hunter (2011) - Episodio 75', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2249, 72, 76, 'Hunter x Hunter (2011) - Episodio 76', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2250, 72, 77, 'Hunter x Hunter (2011) - Episodio 77', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2251, 72, 78, 'Hunter x Hunter (2011) - Episodio 78', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:47+00', '2025-09-04 01:53:47+00'),
(2252, 72, 79, 'Hunter x Hunter (2011) - Episodio 79', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2253, 72, 80, 'Hunter x Hunter (2011) - Episodio 80', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2254, 72, 81, 'Hunter x Hunter (2011) - Episodio 81', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2255, 72, 82, 'Hunter x Hunter (2011) - Episodio 82', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2256, 72, 83, 'Hunter x Hunter (2011) - Episodio 83', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2257, 72, 84, 'Hunter x Hunter (2011) - Episodio 84', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2258, 72, 85, 'Hunter x Hunter (2011) - Episodio 85', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2259, 72, 86, 'Hunter x Hunter (2011) - Episodio 86', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2260, 72, 87, 'Hunter x Hunter (2011) - Episodio 87', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2261, 72, 88, 'Hunter x Hunter (2011) - Episodio 88', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2262, 72, 89, 'Hunter x Hunter (2011) - Episodio 89', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2263, 72, 90, 'Hunter x Hunter (2011) - Episodio 90', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2264, 72, 91, 'Hunter x Hunter (2011) - Episodio 91', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2265, 72, 92, 'Hunter x Hunter (2011) - Episodio 92', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2266, 72, 93, 'Hunter x Hunter (2011) - Episodio 93', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2267, 72, 94, 'Hunter x Hunter (2011) - Episodio 94', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2268, 72, 95, 'Hunter x Hunter (2011) - Episodio 95', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2269, 72, 96, 'Hunter x Hunter (2011) - Episodio 96', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2270, 72, 97, 'Hunter x Hunter (2011) - Episodio 97', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2271, 72, 98, 'Hunter x Hunter (2011) - Episodio 98', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2272, 72, 99, 'Hunter x Hunter (2011) - Episodio 99', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2273, 72, 100, 'Hunter x Hunter (2011) - Episodio 100', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2274, 72, 101, 'Hunter x Hunter (2011) - Episodio 101', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2275, 72, 102, 'Hunter x Hunter (2011) - Episodio 102', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2276, 72, 103, 'Hunter x Hunter (2011) - Episodio 103', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2277, 72, 104, 'Hunter x Hunter (2011) - Episodio 104', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2278, 72, 105, 'Hunter x Hunter (2011) - Episodio 105', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2279, 72, 106, 'Hunter x Hunter (2011) - Episodio 106', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2280, 72, 107, 'Hunter x Hunter (2011) - Episodio 107', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2281, 72, 108, 'Hunter x Hunter (2011) - Episodio 108', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2282, 72, 109, 'Hunter x Hunter (2011) - Episodio 109', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2283, 72, 110, 'Hunter x Hunter (2011) - Episodio 110', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2284, 72, 111, 'Hunter x Hunter (2011) - Episodio 111', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2285, 72, 112, 'Hunter x Hunter (2011) - Episodio 112', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2286, 72, 113, 'Hunter x Hunter (2011) - Episodio 113', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2287, 72, 114, 'Hunter x Hunter (2011) - Episodio 114', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2288, 72, 115, 'Hunter x Hunter (2011) - Episodio 115', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2289, 72, 116, 'Hunter x Hunter (2011) - Episodio 116', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2290, 72, 117, 'Hunter x Hunter (2011) - Episodio 117', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2291, 72, 118, 'Hunter x Hunter (2011) - Episodio 118', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2292, 72, 119, 'Hunter x Hunter (2011) - Episodio 119', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2293, 72, 120, 'Hunter x Hunter (2011) - Episodio 120', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2294, 72, 121, 'Hunter x Hunter (2011) - Episodio 121', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2295, 72, 122, 'Hunter x Hunter (2011) - Episodio 122', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2296, 72, 123, 'Hunter x Hunter (2011) - Episodio 123', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2297, 72, 124, 'Hunter x Hunter (2011) - Episodio 124', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2298, 72, 125, 'Hunter x Hunter (2011) - Episodio 125', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2299, 72, 126, 'Hunter x Hunter (2011) - Episodio 126', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2300, 72, 127, 'Hunter x Hunter (2011) - Episodio 127', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2301, 72, 128, 'Hunter x Hunter (2011) - Episodio 128', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2302, 72, 129, 'Hunter x Hunter (2011) - Episodio 129', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2303, 72, 130, 'Hunter x Hunter (2011) - Episodio 130', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2304, 72, 131, 'Hunter x Hunter (2011) - Episodio 131', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2305, 72, 132, 'Hunter x Hunter (2011) - Episodio 132', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2306, 72, 133, 'Hunter x Hunter (2011) - Episodio 133', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2307, 72, 134, 'Hunter x Hunter (2011) - Episodio 134', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2308, 72, 135, 'Hunter x Hunter (2011) - Episodio 135', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2309, 72, 136, 'Hunter x Hunter (2011) - Episodio 136', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2310, 72, 137, 'Hunter x Hunter (2011) - Episodio 137', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2311, 72, 138, 'Hunter x Hunter (2011) - Episodio 138', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2312, 72, 139, 'Hunter x Hunter (2011) - Episodio 139', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2313, 72, 140, 'Hunter x Hunter (2011) - Episodio 140', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2314, 72, 141, 'Hunter x Hunter (2011) - Episodio 141', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2315, 72, 142, 'Hunter x Hunter (2011) - Episodio 142', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2316, 72, 143, 'Hunter x Hunter (2011) - Episodio 143', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2317, 72, 144, 'Hunter x Hunter (2011) - Episodio 144', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2318, 72, 145, 'Hunter x Hunter (2011) - Episodio 145', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2319, 72, 146, 'Hunter x Hunter (2011) - Episodio 146', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2320, 72, 147, 'Hunter x Hunter (2011) - Episodio 147', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2321, 72, 148, 'Hunter x Hunter (2011) - Episodio 148', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:48+00', '2025-09-04 01:53:48+00'),
(2322, 73, 1, 'Sword Art Online - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2323, 73, 2, 'Sword Art Online - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2324, 73, 3, 'Sword Art Online - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2325, 73, 4, 'Sword Art Online - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2326, 73, 5, 'Sword Art Online - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2327, 73, 6, 'Sword Art Online - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2328, 73, 7, 'Sword Art Online - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2329, 73, 8, 'Sword Art Online - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2330, 73, 9, 'Sword Art Online - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2331, 73, 10, 'Sword Art Online - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2332, 73, 11, 'Sword Art Online - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2333, 73, 12, 'Sword Art Online - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2334, 73, 13, 'Sword Art Online - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2335, 73, 14, 'Sword Art Online - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2336, 73, 15, 'Sword Art Online - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2337, 73, 16, 'Sword Art Online - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2338, 73, 17, 'Sword Art Online - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2339, 73, 18, 'Sword Art Online - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2340, 73, 19, 'Sword Art Online - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2341, 73, 20, 'Sword Art Online - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2342, 73, 21, 'Sword Art Online - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2343, 73, 22, 'Sword Art Online - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2344, 73, 23, 'Sword Art Online - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2345, 73, 24, 'Sword Art Online - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2346, 73, 25, 'Sword Art Online - Episodio 25', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-04 01:53:56+00', '2025-09-04 01:53:56+00'),
(2347, 74, 1, 'Lord of Mysteries - Episodio 1', '', NULL, NULL, NULL, 'available', 8, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:37:44+00'),
(2348, 74, 2, 'Lord of Mysteries - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2349, 74, 3, 'Lord of Mysteries - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2350, 74, 4, 'Lord of Mysteries - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2351, 74, 5, 'Lord of Mysteries - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2352, 74, 6, 'Lord of Mysteries - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2353, 74, 7, 'Lord of Mysteries - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2354, 74, 8, 'Lord of Mysteries - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2355, 74, 9, 'Lord of Mysteries - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2356, 74, 10, 'Lord of Mysteries - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2357, 74, 11, 'Lord of Mysteries - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2358, 74, 12, 'Lord of Mysteries - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2359, 74, 13, 'Lord of Mysteries - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 17:36:56+00', '2025-09-24 17:36:56+00'),
(2360, 75, 1, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 1', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 22:00:59+00'),
(2361, 75, 2, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2362, 75, 3, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2363, 75, 4, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2364, 75, 5, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2365, 75, 6, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2366, 75, 7, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2367, 75, 8, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2368, 75, 9, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2369, 75, 10, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2370, 75, 11, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2371, 75, 12, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:20+00', '2025-09-24 21:59:20+00'),
(2372, 76, 1, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 1', '', NULL, NULL, NULL, 'available', 4, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 22:00:49+00'),
(2373, 76, 2, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2374, 76, 3, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2375, 76, 4, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2376, 76, 5, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2377, 76, 6, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2378, 76, 7, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2379, 76, 8, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2380, 76, 9, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2381, 76, 10, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2382, 76, 11, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2383, 76, 12, 'I Was Reincarnated as the 7th Prince so I Can Take My Time Perfecting My Magical Ability Season 2 - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-24 21:59:31+00', '2025-09-24 21:59:31+00'),
(2384, 77, 1, 'The Seven Deadly Sins - Episodio 1', '', NULL, NULL, NULL, 'pending', 4, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:33:59+00'),
(2385, 77, 2, 'The Seven Deadly Sins - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2386, 77, 3, 'The Seven Deadly Sins - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2387, 77, 4, 'The Seven Deadly Sins - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2388, 77, 5, 'The Seven Deadly Sins - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2389, 77, 6, 'The Seven Deadly Sins - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2390, 77, 7, 'The Seven Deadly Sins - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2391, 77, 8, 'The Seven Deadly Sins - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2392, 77, 9, 'The Seven Deadly Sins - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2393, 77, 10, 'The Seven Deadly Sins - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2394, 77, 11, 'The Seven Deadly Sins - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2395, 77, 12, 'The Seven Deadly Sins - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2396, 77, 13, 'The Seven Deadly Sins - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2397, 77, 14, 'The Seven Deadly Sins - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2398, 77, 15, 'The Seven Deadly Sins - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2399, 77, 16, 'The Seven Deadly Sins - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2400, 77, 17, 'The Seven Deadly Sins - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2401, 77, 18, 'The Seven Deadly Sins - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2402, 77, 19, 'The Seven Deadly Sins - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2403, 77, 20, 'The Seven Deadly Sins - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2404, 77, 21, 'The Seven Deadly Sins - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2405, 77, 22, 'The Seven Deadly Sins - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2406, 77, 23, 'The Seven Deadly Sins - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2407, 77, 24, 'The Seven Deadly Sins - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '2025-09-26 04:32:11+00', '2025-09-26 04:32:11+00'),
(2408, 78, 1, 'JUJUTSU KAISEN - Episodio 1', '', NULL, NULL, NULL, 'available', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-10-16 00:43:03+00'),
(2409, 78, 2, 'JUJUTSU KAISEN - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2410, 78, 3, 'JUJUTSU KAISEN - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2411, 78, 4, 'JUJUTSU KAISEN - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2412, 78, 5, 'JUJUTSU KAISEN - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2413, 78, 6, 'JUJUTSU KAISEN - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2414, 78, 7, 'JUJUTSU KAISEN - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2415, 78, 8, 'JUJUTSU KAISEN - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2416, 78, 9, 'JUJUTSU KAISEN - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2417, 78, 10, 'JUJUTSU KAISEN - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2418, 78, 11, 'JUJUTSU KAISEN - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2419, 78, 12, 'JUJUTSU KAISEN - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2420, 78, 13, 'JUJUTSU KAISEN - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2421, 78, 14, 'JUJUTSU KAISEN - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2422, 78, 15, 'JUJUTSU KAISEN - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2423, 78, 16, 'JUJUTSU KAISEN - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2424, 78, 17, 'JUJUTSU KAISEN - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2425, 78, 18, 'JUJUTSU KAISEN - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2426, 78, 19, 'JUJUTSU KAISEN - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2427, 78, 20, 'JUJUTSU KAISEN - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2428, 78, 21, 'JUJUTSU KAISEN - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2429, 78, 22, 'JUJUTSU KAISEN - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2430, 78, 23, 'JUJUTSU KAISEN - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2431, 78, 24, 'JUJUTSU KAISEN - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:23:59+00', '2025-09-26 05:23:59+00'),
(2432, 79, 1, 'My Hero Academia - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2433, 79, 2, 'My Hero Academia - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2434, 79, 3, 'My Hero Academia - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2435, 79, 4, 'My Hero Academia - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2436, 79, 5, 'My Hero Academia - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2437, 79, 6, 'My Hero Academia - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2438, 79, 7, 'My Hero Academia - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2439, 79, 8, 'My Hero Academia - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2440, 79, 9, 'My Hero Academia - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:21+00', '2025-09-26 05:25:21+00'),
(2441, 79, 10, 'My Hero Academia - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:22+00', '2025-09-26 05:25:22+00'),
(2442, 79, 11, 'My Hero Academia - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:22+00', '2025-09-26 05:25:22+00'),
(2443, 79, 12, 'My Hero Academia - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:23+00', '2025-09-26 05:25:23+00'),
(2444, 79, 13, 'My Hero Academia - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:25:23+00', '2025-09-26 05:25:23+00'),
(2445, 80, 1, 'Attack on Titan Season 2 - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2446, 80, 2, 'Attack on Titan Season 2 - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2447, 80, 3, 'Attack on Titan Season 2 - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2448, 80, 4, 'Attack on Titan Season 2 - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2449, 80, 5, 'Attack on Titan Season 2 - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2450, 80, 6, 'Attack on Titan Season 2 - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2451, 80, 7, 'Attack on Titan Season 2 - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2452, 80, 8, 'Attack on Titan Season 2 - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2453, 80, 9, 'Attack on Titan Season 2 - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2454, 80, 10, 'Attack on Titan Season 2 - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2455, 80, 11, 'Attack on Titan Season 2 - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2456, 80, 12, 'Attack on Titan Season 2 - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:28:38+00', '2025-09-26 05:28:38+00'),
(2457, 81, 1, 'Fullmetal Alchemist: Brotherhood - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2458, 81, 2, 'Fullmetal Alchemist: Brotherhood - Episodio 2', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2459, 81, 3, 'Fullmetal Alchemist: Brotherhood - Episodio 3', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2460, 81, 4, 'Fullmetal Alchemist: Brotherhood - Episodio 4', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2461, 81, 5, 'Fullmetal Alchemist: Brotherhood - Episodio 5', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2462, 81, 6, 'Fullmetal Alchemist: Brotherhood - Episodio 6', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2463, 81, 7, 'Fullmetal Alchemist: Brotherhood - Episodio 7', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2464, 81, 8, 'Fullmetal Alchemist: Brotherhood - Episodio 8', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2465, 81, 9, 'Fullmetal Alchemist: Brotherhood - Episodio 9', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2466, 81, 10, 'Fullmetal Alchemist: Brotherhood - Episodio 10', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2467, 81, 11, 'Fullmetal Alchemist: Brotherhood - Episodio 11', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2468, 81, 12, 'Fullmetal Alchemist: Brotherhood - Episodio 12', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2469, 81, 13, 'Fullmetal Alchemist: Brotherhood - Episodio 13', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2470, 81, 14, 'Fullmetal Alchemist: Brotherhood - Episodio 14', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2471, 81, 15, 'Fullmetal Alchemist: Brotherhood - Episodio 15', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2472, 81, 16, 'Fullmetal Alchemist: Brotherhood - Episodio 16', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2473, 81, 17, 'Fullmetal Alchemist: Brotherhood - Episodio 17', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2474, 81, 18, 'Fullmetal Alchemist: Brotherhood - Episodio 18', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2475, 81, 19, 'Fullmetal Alchemist: Brotherhood - Episodio 19', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2476, 81, 20, 'Fullmetal Alchemist: Brotherhood - Episodio 20', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2477, 81, 21, 'Fullmetal Alchemist: Brotherhood - Episodio 21', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2478, 81, 22, 'Fullmetal Alchemist: Brotherhood - Episodio 22', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2479, 81, 23, 'Fullmetal Alchemist: Brotherhood - Episodio 23', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2480, 81, 24, 'Fullmetal Alchemist: Brotherhood - Episodio 24', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2481, 81, 25, 'Fullmetal Alchemist: Brotherhood - Episodio 25', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2482, 81, 26, 'Fullmetal Alchemist: Brotherhood - Episodio 26', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2483, 81, 27, 'Fullmetal Alchemist: Brotherhood - Episodio 27', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2484, 81, 28, 'Fullmetal Alchemist: Brotherhood - Episodio 28', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2485, 81, 29, 'Fullmetal Alchemist: Brotherhood - Episodio 29', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2486, 81, 30, 'Fullmetal Alchemist: Brotherhood - Episodio 30', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2487, 81, 31, 'Fullmetal Alchemist: Brotherhood - Episodio 31', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2488, 81, 32, 'Fullmetal Alchemist: Brotherhood - Episodio 32', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2489, 81, 33, 'Fullmetal Alchemist: Brotherhood - Episodio 33', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2490, 81, 34, 'Fullmetal Alchemist: Brotherhood - Episodio 34', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2491, 81, 35, 'Fullmetal Alchemist: Brotherhood - Episodio 35', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2492, 81, 36, 'Fullmetal Alchemist: Brotherhood - Episodio 36', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2493, 81, 37, 'Fullmetal Alchemist: Brotherhood - Episodio 37', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2494, 81, 38, 'Fullmetal Alchemist: Brotherhood - Episodio 38', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2495, 81, 39, 'Fullmetal Alchemist: Brotherhood - Episodio 39', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2496, 81, 40, 'Fullmetal Alchemist: Brotherhood - Episodio 40', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2497, 81, 41, 'Fullmetal Alchemist: Brotherhood - Episodio 41', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2498, 81, 42, 'Fullmetal Alchemist: Brotherhood - Episodio 42', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2499, 81, 43, 'Fullmetal Alchemist: Brotherhood - Episodio 43', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2500, 81, 44, 'Fullmetal Alchemist: Brotherhood - Episodio 44', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2501, 81, 45, 'Fullmetal Alchemist: Brotherhood - Episodio 45', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2502, 81, 46, 'Fullmetal Alchemist: Brotherhood - Episodio 46', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2503, 81, 47, 'Fullmetal Alchemist: Brotherhood - Episodio 47', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2504, 81, 48, 'Fullmetal Alchemist: Brotherhood - Episodio 48', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2505, 81, 49, 'Fullmetal Alchemist: Brotherhood - Episodio 49', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2506, 81, 50, 'Fullmetal Alchemist: Brotherhood - Episodio 50', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2507, 81, 51, 'Fullmetal Alchemist: Brotherhood - Episodio 51', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2508, 81, 52, 'Fullmetal Alchemist: Brotherhood - Episodio 52', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2509, 81, 53, 'Fullmetal Alchemist: Brotherhood - Episodio 53', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2510, 81, 54, 'Fullmetal Alchemist: Brotherhood - Episodio 54', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2511, 81, 55, 'Fullmetal Alchemist: Brotherhood - Episodio 55', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2512, 81, 56, 'Fullmetal Alchemist: Brotherhood - Episodio 56', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2513, 81, 57, 'Fullmetal Alchemist: Brotherhood - Episodio 57', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2514, 81, 58, 'Fullmetal Alchemist: Brotherhood - Episodio 58', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2515, 81, 59, 'Fullmetal Alchemist: Brotherhood - Episodio 59', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2516, 81, 60, 'Fullmetal Alchemist: Brotherhood - Episodio 60', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2517, 81, 61, 'Fullmetal Alchemist: Brotherhood - Episodio 61', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2518, 81, 62, 'Fullmetal Alchemist: Brotherhood - Episodio 62', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2519, 81, 63, 'Fullmetal Alchemist: Brotherhood - Episodio 63', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2520, 81, 64, 'Fullmetal Alchemist: Brotherhood - Episodio 64', NULL, NULL, NULL, NULL, 'pending', 0, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:31:18+00', '2025-09-26 05:31:18+00'),
(2521, 82, 1, 'Your Name. - Episodio 1', NULL, NULL, NULL, NULL, 'pending', 3, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), '2025-09-26 05:34:28+00', '2025-09-26 05:34:28+00')
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 9. FUENTES DE VIDEO (public.episode_sources) - 6 fuentes legacy
-- ========================================================
INSERT INTO public.episode_sources (episode_id, provider, server_name, embed_url, language, quality, priority, is_active) VALUES
(2089, 'legacy_primary', 'Servidor 1', 'https://www.youtube.com/embed/deUHydCzo08?si=MRgLv7OT2Vzkp8_1', 'sub', '1080p', 1, true),
(2089, 'legacy_secondary', 'Servidor 2', 'https://www.youtube.com/embed/deUHydCzo08?si=MRgLv7OT2Vzkp8_1', 'sub', '1080p', 2, true),
(2089, 'legacy_backup', 'Servidor 3', 'https://www.youtube.com/embed/deUHydCzo08?si=MRgLv7OT2Vzkp8_1', 'sub', '1080p', 3, true),
(2347, 'legacy_primary', 'Servidor 1', 'https://www.youtube.com/embed/deUHydCzo08?si=MRgLv7OT2Vzkp8_1', 'sub', '1080p', 1, true),
(2347, 'legacy_secondary', 'Servidor 2', 'https://www.youtube.com/embed/deUHydCzo08?si=MRgLv7OT2Vzkp8_1', 'sub', '1080p', 2, true),
(2347, 'legacy_backup', 'Servidor 3', 'https://www.youtube.com/embed/deUHydCzo08?si=MRgLv7OT2Vzkp8_1', 'sub', '1080p', 3, true)
ON CONFLICT (episode_id, provider, language, quality) DO NOTHING;

-- ========================================================
-- 10. ESTADO DE EPISODIOS VISTOS (public.user_episode_status) - 8 registros
-- ========================================================
INSERT INTO public.user_episode_status (user_id, episode_id, is_watched, watched_at, created_at, updated_at) VALUES
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2089, true, '2025-09-04 01:56:05+00', '2025-09-04 01:56:05+00', '2025-09-04 01:56:05+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2090, true, '2025-09-04 01:56:06+00', '2025-09-04 01:56:06+00', '2025-09-04 01:56:06+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2091, true, '2025-09-04 01:56:06+00', '2025-09-04 01:56:06+00', '2025-09-04 01:56:06+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2092, true, '2025-09-04 01:56:07+00', '2025-09-04 01:56:07+00', '2025-09-04 01:56:07+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2093, true, '2025-09-04 01:56:08+00', '2025-09-04 01:56:08+00', '2025-09-04 01:56:08+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2094, true, '2025-09-04 01:56:09+00', '2025-09-04 01:56:09+00', '2025-09-04 01:56:09+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2095, true, '2025-09-04 01:56:55+00', '2025-09-04 01:56:10+00', '2025-09-04 01:56:55+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2096, true, '2025-09-24 22:53:20+00', '2025-09-04 01:56:57+00', '2025-09-24 22:53:20+00')
ON CONFLICT (user_id, episode_id) DO NOTHING;

-- ========================================================
-- 11. HISTORIAL RESUELTO (public.user_history) - 17 estados únicos con MIN/MAX recencia
-- ========================================================
INSERT INTO public.user_history (user_id, episode_id, progress_seconds, total_seconds, is_completed, created_at, updated_at) VALUES
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2385, 0, 1440, false, '2025-08-27 13:45:48+00', '2025-08-31 00:55:17+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2386, 0, 1440, false, '2025-08-27 13:45:50+00', '2025-08-31 01:02:55+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2389, 0, 1440, false, '2025-08-27 13:53:34+00', '2025-08-27 13:53:34+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2384, 0, 1440, false, '2025-08-27 13:53:52+00', '2025-08-31 00:54:53+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2387, 0, 1440, false, '2025-08-30 23:25:09+00', '2025-08-30 23:25:09+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2089, 0, 1440, false, '2025-09-04 01:56:05+00', '2025-09-26 17:19:02+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2090, 0, 1440, false, '2025-09-04 01:56:06+00', '2025-09-04 01:56:06+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2091, 0, 1440, false, '2025-09-04 01:56:06+00', '2025-09-04 01:56:06+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2092, 0, 1440, false, '2025-09-04 01:56:07+00', '2025-09-04 01:56:07+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2093, 0, 1440, false, '2025-09-04 01:56:08+00', '2025-09-04 01:56:08+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2094, 0, 1440, false, '2025-09-04 01:56:09+00', '2025-09-04 01:56:09+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2095, 0, 1440, false, '2025-09-04 01:56:10+00', '2025-09-04 01:56:55+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2096, 0, 1440, false, '2025-09-04 01:56:57+00', '2025-09-26 17:21:37+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2372, 0, 1440, false, '2025-09-24 22:02:56+00', '2025-09-24 22:02:56+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), 2384, 0, 1440, false, '2025-09-26 04:33:35+00', '2025-09-26 04:33:35+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2521, 0, 1440, false, '2025-09-26 16:51:58+00', '2025-09-26 16:51:58+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 2347, 0, 1440, false, '2025-09-26 17:24:18+00', '2025-09-26 17:24:18+00')
ON CONFLICT (user_id, episode_id) DO NOTHING;

-- ========================================================
-- 12. HISTORIAL NO RESUELTO / STAGING (public.unresolved_legacy_history) - 5 registros
-- ========================================================
INSERT INTO public.unresolved_legacy_history (legacy_id, user_id, legacy_anime_id, anime_title, anime_ep, anime_image, anime_release, dub_or_sub, anime_type, created_at) VALUES
(3, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'black-clover-tv-episode-1', '', '', '', '', 'sub', '', '2025-08-20 23:17:05+00'),
(145, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'private-tutor-to-the-duke-s-daughter-1', 'Private Tutor to the Duke''s Daughter', '1', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx170113-dk9h9ybZnGnZ.jpg', '2025', 'sub', 'ONA', '2025-09-03 22:59:44+00'),
(148, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'private-tutor-to-the-duke-s-daughter-2', 'Private Tutor to the Duke''s Daughter', '2', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx170113-dk9h9ybZnGnZ.jpg', '2025', 'sub', 'ONA', '2025-09-03 23:00:53+00'),
(151, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'black-clover-1', 'Black Clover', '1', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-fyh8o7gNbha0.png', '2017', 'sub', 'TV', '2025-09-04 00:22:10+00'),
(192, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), '7seeds-1', '7SEEDS', '1', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx105807-Ivd7xc40XdGF.jpg', '2019', 'sub', 'ONA', '2025-09-26 17:30:17+00')
ON CONFLICT (legacy_id) DO NOTHING;

-- ========================================================
-- 13. WATCHLIST RESUELTO (public.watch_later) - 3 elementos
-- ========================================================
INSERT INTO public.watch_later (user_id, anime_id, created_at) VALUES
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 69, '2025-09-04 00:08:37+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 67, '2025-09-24 22:52:11+00'),
((SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 4), 68, '2025-09-27 02:35:32+00')
ON CONFLICT (user_id, anime_id) DO NOTHING;

-- ========================================================
-- 14. WATCHLIST NO RESUELTO / STAGING (public.unresolved_watch_later) - 3 elementos
-- ========================================================
INSERT INTO public.unresolved_watch_later (legacy_id, user_id, name, legacy_slug, image, type, released, created_at) VALUES
(11, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'Rascal Does Not Dream of Bunny Girl Senpai', 'rascal-does-not-dream-of-bunny-girl-senpai', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101291-wfEdgPqtfU0l.jpg', 'TV', '2018', '2025-09-04 00:08:53+00'),
(12, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'Re:ZERO -Starting Life in Another World-', 're-zero-starting-life-in-another-world', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21355-wRVUrGxpvIQQ.jpg', 'TV', '2016', '2025-09-04 00:08:55+00'),
(14, (SELECT supabase_uuid FROM public.migration_user_map WHERE legacy_id = 2), 'Naruto: Shippuden', 'naruto-shippuden', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-kGfVm0YqCPcu.png', 'TV', '2007', '2025-09-04 00:09:18+00')
ON CONFLICT (legacy_id) DO NOTHING;

-- ========================================================
-- 15. CONFIGURACIÓN GLOBAL PÚBLICA (public.app_settings)
-- NOTA ARQUITECTÓNICA: Los contadores 'like_count' y 'dislike_count' del dump legacy han sido
-- formalmente deprecados en TotalAnime 2.0 en favor de métricas limpias basadas en vistas reales.
-- ========================================================
INSERT INTO public.app_settings (key, value, description) VALUES
('maintenance_mode', 'false'::jsonb, 'Activar modo mantenimiento'),
('user_registration_enabled', 'true'::jsonb, 'Permitir registro de nuevos usuarios'),
('max_login_attempts', '5'::jsonb, 'Máximo intentos de login antes de bloqueo'),
('login_attempt_window', '300'::jsonb, 'Ventana de tiempo para intentos de login (segundos)'),
('session_timeout', '3600'::jsonb, 'Timeout de sesión en segundos'),
('password_min_length', '8'::jsonb, 'Longitud mínima de contraseña'),
('enable_2fa', 'false'::jsonb, 'Habilitar autenticación de dos factores'),
('debug_mode', 'false'::jsonb, 'Modo debug para desarrollo'),
('cache_enabled', 'true'::jsonb, 'Habilitar sistema de cache'),
('cache_ttl', '3600'::jsonb, 'Tiempo de vida del cache en segundos')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ========================================================
-- 16. SINCRONIZACIÓN DE SECUENCIAS POSTGRESQL
-- ========================================================
SELECT setval('public.genres_id_seq', COALESCE((SELECT MAX(id) FROM public.genres), 1));
SELECT setval('public.avatars_id_seq', COALESCE((SELECT MAX(id) FROM public.avatars), 1));
SELECT setval('public.animes_id_seq', COALESCE((SELECT MAX(id) FROM public.animes), 1));
SELECT setval('public.episodes_id_seq', COALESCE((SELECT MAX(id) FROM public.episodes), 1));
SELECT setval('public.episode_sources_id_seq', COALESCE((SELECT MAX(id) FROM public.episode_sources), 1));
SELECT setval('public.user_history_id_seq', COALESCE((SELECT MAX(id) FROM public.user_history), 1));
SELECT setval('public.unresolved_legacy_history_id_seq', COALESCE((SELECT MAX(id) FROM public.unresolved_legacy_history), 1));
SELECT setval('public.watch_later_id_seq', COALESCE((SELECT MAX(id) FROM public.watch_later), 1));
SELECT setval('public.unresolved_watch_later_id_seq', COALESCE((SELECT MAX(id) FROM public.unresolved_watch_later), 1));
