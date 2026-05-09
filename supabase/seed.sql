insert into public.seasons (id, name, year, status) values
('10000000-0000-0000-0000-000000000001', 'MEL Season 1', 2026, 'active');

insert into public.championships (id, season_id, name, car_class, description, status) values
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'MEL European Endurance Cup', 'Multi-class', 'Class-based Le Mans Ultimate racing for European and global sim racing drivers.', 'active');

insert into public.teams (id, name, logo_url, country, description) values
('30000000-0000-0000-0000-000000000001', 'Apex Vector Racing', '/teams/apex-vector-racing.svg', 'Germany', 'Disciplined endurance squad.'),
('30000000-0000-0000-0000-000000000002', 'Silverline Motorsport', '/teams/silverline-motorsport.svg', 'France', 'Driver development team.'),
('30000000-0000-0000-0000-000000000003', 'Velocity Works', '/teams/velocity-works.svg', 'Italy', 'LMGT3 specialists.'),
('30000000-0000-0000-0000-000000000004', 'Carbon Edge Racing', '/teams/carbon-edge-racing.svg', 'Netherlands', 'Multi-class roster.');

insert into public.drivers (id, display_name, country, region, car_number, team_id, discord_username, steam_id, preferred_class, preferred_car, rating, safety_rating, approval_status) values
('40000000-0000-0000-0000-000000000001', 'Alex Martin', 'France', 'Paris', 7, '30000000-0000-0000-0000-000000000001', 'alexmartin', '76561198000000007', 'Hypercar', 'Hypercar class entry', 1842, 'A', 'approved'),
('40000000-0000-0000-0000-000000000002', 'Lucas Weber', 'Germany', 'Munich', 34, '30000000-0000-0000-0000-000000000001', 'lucasweber', '76561198000000034', 'LMP2', 'LMP2 class entry', 1715, 'A', 'approved'),
('40000000-0000-0000-0000-000000000003', 'Daniel Rossi', 'Italy', 'Milan', 11, '30000000-0000-0000-0000-000000000002', 'danielrossi', '76561198000000011', 'LMGT3', 'LMGT3 class entry', 1688, 'B', 'approved'),
('40000000-0000-0000-0000-000000000004', 'Thomas Reed', 'United Kingdom', 'Manchester', 22, '30000000-0000-0000-0000-000000000003', 'thomasreed', '76561198000000022', 'LMGT3', 'LMGT3 class entry', 1901, 'S', 'approved'),
('40000000-0000-0000-0000-000000000005', 'Max Keller', 'Austria', 'Vienna', 95, '30000000-0000-0000-0000-000000000004', 'maxkeller', '76561198000000095', 'Hypercar', 'Hypercar class entry', 1770, 'A', 'approved');

insert into public.races (id, championship_id, name, track_name, race_date, format, category, setup, car_class, registration_status, status, stream_url, replay_url) values
('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Preseason Test - Portimao', 'Algarve International Circuit', '2026-05-03 18:00:00+02', 'Practice + Qualifying + Test Race', 'Test Race', 'Fixed setup', 'LMGT3', 'closed', 'completed', 'https://www.twitch.tv/medenduranceleague', 'https://www.youtube.com/@medenduranceleague'),
('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'June 12 - Spa-Francorchamps', 'Circuit de Spa-Francorchamps', '2026-06-12 21:00:00+03', '20m Qualifying + 40m Sprint Race', 'Sprint Race', 'Fixed setup', 'LMGT3', 'open', 'upcoming', 'https://www.twitch.tv/medenduranceleague', null),
('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'June 19 - Monza', 'Autodromo Nazionale Monza', '2026-06-19 21:00:00+03', '20m Qualifying + 40m Sprint Race', 'Sprint Race', 'Fixed setup', 'LMGT3', 'open', 'upcoming', 'https://www.twitch.tv/medenduranceleague', null),
('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'June 26 - Fuji Speedway', 'Fuji Speedway', '2026-06-26 21:00:00+03', '20m Qualifying + 40m Sprint Race', 'Sprint Race', 'Fixed setup', 'LMGT3', 'open', 'upcoming', 'https://www.twitch.tv/medenduranceleague', null),
('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'July 3 - Le Mans', 'Circuit de la Sarthe', '2026-07-03 21:00:00+03', '20m Qualifying + 40m Sprint Race', 'Sprint Race', 'Fixed setup', 'LMGT3', 'open', 'upcoming', 'https://www.twitch.tv/medenduranceleague', null);

insert into public.race_results (race_id, driver_id, team_id, position, qualifying_position, points, best_lap, total_time, gap, laps_completed, penalties_seconds, penalty_points, fastest_lap) values
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 1, 2, 26, '1:42.381', '45:14.920', 'Leader', 26, 0, 0, true),
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 2, 1, 18, '1:42.644', '45:18.301', '+3.381', 26, 0, 0, false),
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', 3, 4, 15, '1:43.008', '45:25.871', '+10.951', 26, 5, 1, false),
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 4, 3, 12, '1:43.190', '45:30.617', '+15.697', 26, 0, 0, false);

insert into public.news_posts (title, body, published) values
('Driver applications open for the first MEL endurance season', 'Applications are reviewed manually to keep the grid clean and broadcast-ready.', true),
('Preseason test complete at Portimao', 'Race control validated result imports and steward reporting after the first community test.', true);
