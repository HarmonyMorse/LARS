DROP TABLE IF EXISTS counts;
DROP TABLE IF EXISTS personal_counts;

CREATE TABLE counts (
 id SERIAL PRIMARY KEY,
 value INTEGER
);

CREATE TABLE IF NOT EXISTS personal_counts (
 user_id uuid references auth.users (id) not null primary key,
 value integer default 0
);

INSERT INTO counts (value) VALUES (0);