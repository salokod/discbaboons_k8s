--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bag_contents; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.bag_contents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    bag_id uuid,
    disc_id uuid NOT NULL,
    notes character varying(255),
    weight numeric(4,1),
    condition character varying(20),
    plastic_type character varying(50),
    color character varying(50),
    is_lost boolean DEFAULT false,
    added_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    speed integer,
    glide integer,
    turn integer,
    fade integer,
    brand character varying(50),
    model character varying(50),
    lost_notes character varying(255),
    lost_at timestamp without time zone,
    CONSTRAINT chk_condition_values CHECK (((condition)::text = ANY ((ARRAY['new'::character varying, 'good'::character varying, 'worn'::character varying, 'beat-in'::character varying])::text[]))),
    CONSTRAINT chk_fade_range CHECK (((fade IS NULL) OR ((fade >= 0) AND (fade <= 5)))),
    CONSTRAINT chk_glide_range CHECK (((glide IS NULL) OR ((glide >= 1) AND (glide <= 7)))),
    CONSTRAINT chk_speed_range CHECK (((speed IS NULL) OR ((speed >= 1) AND (speed <= 15)))),
    CONSTRAINT chk_turn_range CHECK (((turn IS NULL) OR ((turn >= '-5'::integer) AND (turn <= 2)))),
    CONSTRAINT chk_weight_range CHECK (((weight IS NULL) OR ((weight >= 1.0) AND (weight <= 300.0))))
);


ALTER TABLE public.bag_contents OWNER TO app_user;

--
-- Name: COLUMN bag_contents.speed; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.speed IS 'User-specific speed override. NULL means use disc_master.speed';


--
-- Name: COLUMN bag_contents.glide; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.glide IS 'User-specific glide override. NULL means use disc_master.glide';


--
-- Name: COLUMN bag_contents.turn; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.turn IS 'User-specific turn override. NULL means use disc_master.turn';


--
-- Name: COLUMN bag_contents.fade; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.fade IS 'User-specific fade override. NULL means use disc_master.fade';


--
-- Name: COLUMN bag_contents.brand; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.brand IS 'Custom brand name override for this specific disc instance (falls back to disc_master.brand if null)';


--
-- Name: COLUMN bag_contents.model; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.model IS 'Custom model name override for this specific disc instance (falls back to disc_master.model if null)';


--
-- Name: COLUMN bag_contents.lost_notes; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.lost_notes IS 'Notes about where/how the disc was lost (e.g., "prospect park hole 12")';


--
-- Name: COLUMN bag_contents.lost_at; Type: COMMENT; Schema: public; Owner: app_user
--

COMMENT ON COLUMN public.bag_contents.lost_at IS 'Timestamp when the disc was marked as lost';


--
-- Name: bags; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.bags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    is_friends_visible boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bags OWNER TO app_user;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.courses (
    id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    zip character varying(10),
    hole_count integer NOT NULL,
    rating numeric(3,1),
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_user_submitted boolean DEFAULT false,
    approved boolean DEFAULT true,
    submitted_by_id integer,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.courses OWNER TO app_user;

--
-- Name: disc_master; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.disc_master (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    speed integer NOT NULL,
    glide integer NOT NULL,
    turn integer NOT NULL,
    fade integer NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    added_by_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.disc_master OWNER TO app_user;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO app_user;

--
-- Name: friendship_requests; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.friendship_requests (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    recipient_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.friendship_requests OWNER TO app_user;

--
-- Name: friendship_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: app_user
--

CREATE SEQUENCE public.friendship_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friendship_requests_id_seq OWNER TO app_user;

--
-- Name: friendship_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app_user
--

ALTER SEQUENCE public.friendship_requests_id_seq OWNED BY public.friendship_requests.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(100),
    bio text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country character varying(100),
    state_province character varying(100),
    city character varying(100),
    isnamepublic boolean DEFAULT false,
    isbiopublic boolean DEFAULT false,
    islocationpublic boolean DEFAULT false
);


ALTER TABLE public.user_profiles OWNER TO app_user;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: app_user
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profiles_id_seq OWNER TO app_user;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app_user
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash text NOT NULL,
    last_password_change timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255),
    is_admin boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO app_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: app_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO app_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: app_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: friendship_requests id; Type: DEFAULT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.friendship_requests ALTER COLUMN id SET DEFAULT nextval('public.friendship_requests_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: bag_contents bag_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_pkey PRIMARY KEY (id);


--
-- Name: bags bags_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.bags
    ADD CONSTRAINT bags_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: disc_master disc_master_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.disc_master
    ADD CONSTRAINT disc_master_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: friendship_requests friendship_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_pkey PRIMARY KEY (id);


--
-- Name: friendship_requests unique_friendship; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT unique_friendship UNIQUE (requester_id, recipient_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_bag_contents_bag_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_bag_id ON public.bag_contents USING btree (bag_id);


--
-- Name: idx_bag_contents_brand; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_brand ON public.bag_contents USING btree (brand) WHERE (brand IS NOT NULL);


--
-- Name: idx_bag_contents_disc_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_disc_id ON public.bag_contents USING btree (disc_id);


--
-- Name: idx_bag_contents_is_lost; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_is_lost ON public.bag_contents USING btree (is_lost);


--
-- Name: idx_bag_contents_lost_at; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_lost_at ON public.bag_contents USING btree (lost_at);


--
-- Name: idx_bag_contents_model; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_model ON public.bag_contents USING btree (model) WHERE (model IS NOT NULL);


--
-- Name: idx_bag_contents_user_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bag_contents_user_id ON public.bag_contents USING btree (user_id);


--
-- Name: idx_bags_is_friends_visible; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bags_is_friends_visible ON public.bags USING btree (is_friends_visible);


--
-- Name: idx_bags_is_public; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bags_is_public ON public.bags USING btree (is_public);


--
-- Name: idx_bags_user_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_bags_user_id ON public.bags USING btree (user_id);


--
-- Name: idx_courses_approved; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_courses_approved ON public.courses USING btree (approved);


--
-- Name: idx_courses_city; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_courses_city ON public.courses USING btree (city);


--
-- Name: idx_courses_is_user_submitted; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_courses_is_user_submitted ON public.courses USING btree (is_user_submitted);


--
-- Name: idx_courses_location; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_courses_location ON public.courses USING btree (latitude, longitude);


--
-- Name: idx_courses_state; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_courses_state ON public.courses USING btree (state);


--
-- Name: idx_disc_master_approved; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_disc_master_approved ON public.disc_master USING btree (approved);


--
-- Name: idx_disc_master_brand_model; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_disc_master_brand_model ON public.disc_master USING btree (brand, model);


--
-- Name: idx_friendship_requests_recipient_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_friendship_requests_recipient_id ON public.friendship_requests USING btree (recipient_id);


--
-- Name: idx_user_profiles_country; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_user_profiles_country ON public.user_profiles USING btree (country);


--
-- Name: idx_user_profiles_created_at; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_user_profiles_created_at ON public.user_profiles USING btree (created_at);


--
-- Name: idx_user_profiles_state_province; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_user_profiles_state_province ON public.user_profiles USING btree (state_province);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE UNIQUE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_users_last_password_change; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX idx_users_last_password_change ON public.users USING btree (last_password_change);


--
-- Name: bag_contents bag_contents_bag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_bag_id_fkey FOREIGN KEY (bag_id) REFERENCES public.bags(id) ON DELETE SET NULL;


--
-- Name: bag_contents bag_contents_disc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_disc_id_fkey FOREIGN KEY (disc_id) REFERENCES public.disc_master(id) ON DELETE CASCADE;


--
-- Name: bag_contents bag_contents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bags bags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.bags
    ADD CONSTRAINT bags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_submitted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_submitted_by_id_fkey FOREIGN KEY (submitted_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: disc_master disc_master_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.disc_master
    ADD CONSTRAINT disc_master_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: friendship_requests friendship_requests_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendship_requests friendship_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

