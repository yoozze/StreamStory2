-- CREATE SCHEMA IF NOT EXISTS public;

--
-- Table: users
--

-- DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS public.users (
    id serial PRIMARY KEY,
    group_id integer DEFAULT 2 NOT NULL,
    name varchar(255) NOT NULL DEFAULT '',
    email varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL,
    active boolean DEFAULT false NOT NULL,
    settings json NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    last_login_at timestamp
    -- CONSTRAINT group_fkey
    --     FOREIGN KEY(group_id)
	--         REFERENCES groups(id)
);

DO $$
    BEGIN
        IF NOT EXISTS
            (
                SELECT *
                FROM users
                WHERE email = 'streamstory@ijs.si'
            )
        THEN
            INSERT INTO users (
                group_id,
                name,
                email,
                password,
                active,
                settings
            )
            VALUES (
                1,
                'Admin',
                'streamstory@ijs.si',
                '$2a$10$kF2crRMmb.4xOA28lt6CDejGe9bShzUllL9hJxwSfr0zb3zjilIYW',
                true,
                '{}'
            );
        END IF;
    END
$$;

--
-- Table: tokens
--

-- DROP TABLE IF EXISTS tokens;
CREATE TABLE IF NOT EXISTS public.tokens (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    value character(64) NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT user_fkey
        FOREIGN KEY(user_id)
	        REFERENCES users(id)
);

--
-- Table: api_keys
--

-- DROP TABLE IF EXISTS api_keys;
CREATE TABLE IF NOT EXISTS public.api_keys (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    value character(64) NOT NULL,
    domain text NOT NULL,
    CONSTRAINT user_fkey
        FOREIGN KEY(user_id)
	        REFERENCES users(id)
);

--
-- Table: sessions
--

-- DROP TABLE IF EXISTS sessions;
CREATE TABLE IF NOT EXISTS public.sessions (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL,
    CONSTRAINT session_pkey
        PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
)
WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- DO $$
--     BEGIN
--         IF NOT EXISTS
--             (
--                 SELECT 1
--                 FROM information_schema.tables
--                 WHERE table_schema = 'public'
--                     AND table_name = 'session'
--             )
--         THEN
--             CREATE TABLE public.sessions (
--                 sid varchar NOT NULL COLLATE 'default',
--                 sess json NOT NULL,
--                 expire timestamp(6) NOT NULL
--             )
--             WITH (OIDS=FALSE);

--             ALTER TABLE sessions
--             ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

--             CREATE INDEX IDX_session_expire ON sessions (expire);
--         END IF;
--     END
-- $$;

--
-- Table: models
--

-- DROP TABLE IF EXISTS models;
CREATE TABLE IF NOT EXISTS public.models (
    id serial PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    user_id integer NOT NULL,
    datasource_id integer,
    name varchar(255) NOT NULL,
    description text NOT NULL DEFAULT '',
    dataset varchar(255) NOT NULL,
    online boolean DEFAULT false NOT NULL,
    active boolean DEFAULT false NOT NULL,
    public boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    model json NOT NULL,
    state json,
    CONSTRAINT user_fkey
        FOREIGN KEY(user_id)
	        REFERENCES users(id)
);

--
-- Table: datasources
--

-- DROP TABLE IF EXISTS datasources;
CREATE TABLE IF NOT EXISTS public.datasources (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    name varchar(255) NOT NULL,
    description text NOT NULL DEFAULT '',
    url text NOT NULL,
    time_window_start timestamp,
    time_window_end timestamp,
    interval integer,
    CONSTRAINT user_fkey
        FOREIGN KEY(user_id)
	        REFERENCES users(id)
);

--
-- Table: notifications
--

CREATE TABLE IF NOT EXISTS public.notifications (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    model_id integer,
    type varchar(64),
    title text NOT NULL,
    content text NOT NULL,
    time timestamp DEFAULT now() NOT NULL,
    read boolean DEFAULT false NOT NULL,
    CONSTRAINT user_fkey
        FOREIGN KEY(user_id)
	        REFERENCES users(id),
    CONSTRAINT model_fkey
        FOREIGN KEY(model_id)
	        REFERENCES models(id)
);

--
-- Table: user_model
--

CREATE TABLE IF NOT EXISTS public.user_model (
    id serial PRIMARY KEY,
    user_id integer NOT NULL,
    model_id integer,
    CONSTRAINT user_fkey
        FOREIGN KEY(user_id)
	        REFERENCES users(id),
    CONSTRAINT model_fkey
        FOREIGN KEY(model_id)
	        REFERENCES models(id)
);
