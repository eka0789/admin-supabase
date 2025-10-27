-- Enable required extensions (idempotent)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- Optional: http client in postgres (not required for now)
-- create extension if not exists "pg_net";
