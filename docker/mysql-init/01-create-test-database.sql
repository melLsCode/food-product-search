-- The development database is created by MYSQL_DATABASE in docker-compose.yml.
-- This script adds the separate database used by the automated tests, so both
-- live in the same container and are created identically on every fresh start.
CREATE DATABASE IF NOT EXISTS food_search_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON food_search_test.* TO 'app'@'%';
FLUSH PRIVILEGES;
