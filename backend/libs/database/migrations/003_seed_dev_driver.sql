-- Dev seed: test driver linked to a verified user (run after first user registers + KYC)
-- Usage: replace USER_ID with actual user UUID after registration

-- Example seed function (manual):
-- INSERT INTO vehicles (make, model, year, color, plate_number, category)
-- VALUES ('Chevrolet', 'Cobalt', 2021, 'Oq', '01A123BC', 'economy') RETURNING id;
-- INSERT INTO drivers (user_id, vehicle_id, status, is_online, current_location)
-- VALUES ('USER_ID', 'VEHICLE_ID', 'approved', false,
--   ST_SetSRID(ST_MakePoint(69.2401, 41.2995), 4326)::geography);
