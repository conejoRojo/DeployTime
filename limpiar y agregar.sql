SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE project_collaborators;
TRUNCATE TABLE time_entries;
TRUNCATE TABLE tasks;
TRUNCATE TABLE projects;
TRUNCATE TABLE password_reset_tokens;
TRUNCATE TABLE sessions;
SET FOREIGN_KEY_CHECKS = 1;

UPDATE users SET PASSWORD = "$2y$12$4omD8k3KFDzc4MWqY1nO8eZH.1KqqvVevNVmLyZbkg2zJffpXdXRy" WHERE email = 'luis@dixer.net';
UPDATE users SET PASSWORD = "$2y$12$tWzhMM2NNMSlTo0Fgey6d.r9aqJb2aLamSSRLZZooLrrHyATumo/G" WHERE email = 'martin@dixer.net';
UPDATE users SET PASSWORD = "$2y$12$aKf9SamYbF8SA8ZmV/rpG.vrQ8Hsu5qh7ShimE2agq8lGvtdUe73i" WHERE email = 'juanchi@dixer.net';
INSERT INTO users (NAME, email, PASSWORD, role, created_at, updated_at) VALUES ('Lautaro', 'lautaro@dixer.net',"$2y$12$Q.HkAd7tjLB42ONX9Q24HuFZnJGvgPGrRVFmqHahra0qZ6Tru0AYq",'collaborator',NOW(),NOW());