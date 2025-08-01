--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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
-- Name: bag_contents; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN bag_contents.speed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.speed IS 'User-specific speed override. NULL means use disc_master.speed';


--
-- Name: COLUMN bag_contents.glide; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.glide IS 'User-specific glide override. NULL means use disc_master.glide';


--
-- Name: COLUMN bag_contents.turn; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.turn IS 'User-specific turn override. NULL means use disc_master.turn';


--
-- Name: COLUMN bag_contents.fade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.fade IS 'User-specific fade override. NULL means use disc_master.fade';


--
-- Name: COLUMN bag_contents.brand; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.brand IS 'Custom brand name override for this specific disc instance (falls back to disc_master.brand if null)';


--
-- Name: COLUMN bag_contents.model; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.model IS 'Custom model name override for this specific disc instance (falls back to disc_master.model if null)';


--
-- Name: COLUMN bag_contents.lost_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.lost_notes IS 'Notes about where/how the disc was lost (e.g., "prospect park hole 12")';


--
-- Name: COLUMN bag_contents.lost_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.bag_contents.lost_at IS 'Timestamp when the disc was marked as lost';


--
-- Name: bags; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    city character varying(100) NOT NULL,
    state_province character varying(50) NOT NULL,
    postal_code character varying(10),
    hole_count integer NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_user_submitted boolean DEFAULT false,
    approved boolean DEFAULT true,
    submitted_by_id integer,
    admin_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    country character varying(2) DEFAULT 'US'::character varying NOT NULL,
    reviewed_at timestamp without time zone,
    reviewed_by_id integer
);


--
-- Name: TABLE courses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.courses IS 'Course information without user ratings - ratings removed as they were deemed unnecessary for core functionality';


--
-- Name: COLUMN courses.state_province; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.courses.state_province IS 'State, province, or region within country';


--
-- Name: COLUMN courses.postal_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.courses.postal_code IS 'ZIP code, postal code, or equivalent for the country';


--
-- Name: COLUMN courses.country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.courses.country IS 'Two-letter ISO country code (e.g., US, CA, AU, GB)';


--
-- Name: COLUMN courses.reviewed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.courses.reviewed_at IS 'Timestamp when admin reviewed the course (approved or denied)';


--
-- Name: COLUMN courses.reviewed_by_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.courses.reviewed_by_id IS 'Admin user ID who reviewed the course';


--
-- Name: disc_master; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: friendship_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendship_requests (
    id integer NOT NULL,
    requester_id integer NOT NULL,
    recipient_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: friendship_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.friendship_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: friendship_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.friendship_requests_id_seq OWNED BY public.friendship_requests.id;


--
-- Name: round_hole_pars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.round_hole_pars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    round_id uuid NOT NULL,
    hole_number integer NOT NULL,
    par integer DEFAULT 3 NOT NULL,
    set_by_player_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_hole_number CHECK (((hole_number > 0) AND (hole_number <= 50))),
    CONSTRAINT check_par CHECK (((par > 0) AND (par <= 10)))
);


--
-- Name: TABLE round_hole_pars; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.round_hole_pars IS 'Par values for each hole in a round, editable by any player';


--
-- Name: COLUMN round_hole_pars.par; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.round_hole_pars.par IS 'Par value for this hole (default 3, editable during round)';


--
-- Name: COLUMN round_hole_pars.set_by_player_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.round_hole_pars.set_by_player_id IS 'Player who last set/changed the par value';


--
-- Name: round_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.round_players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    round_id uuid NOT NULL,
    user_id integer,
    guest_name character varying(100),
    is_guest boolean DEFAULT false,
    joined_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_player_type CHECK ((((is_guest = true) AND (guest_name IS NOT NULL) AND (user_id IS NULL)) OR ((is_guest = false) AND (user_id IS NOT NULL) AND (guest_name IS NULL))))
);


--
-- Name: rounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rounds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by_id integer NOT NULL,
    course_id character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    start_time timestamp without time zone DEFAULT now() NOT NULL,
    starting_hole integer DEFAULT 1 NOT NULL,
    is_private boolean DEFAULT false,
    skins_enabled boolean DEFAULT false,
    skins_value numeric(10,2),
    status character varying(20) DEFAULT 'in_progress'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_starting_hole CHECK (((starting_hole > 0) AND (starting_hole <= 50)))
);


--
-- Name: COLUMN rounds.start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rounds.start_time IS 'Round start time - always set to creation time, no future scheduling';


--
-- Name: COLUMN rounds.starting_hole; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rounds.starting_hole IS 'Which hole number to start the round on (default 1)';


--
-- Name: COLUMN rounds.skins_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rounds.skins_value IS 'Dollar amount per hole for skins game, carries over on ties';


--
-- Name: scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    round_id uuid NOT NULL,
    player_id uuid NOT NULL,
    hole_number integer NOT NULL,
    strokes integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_hole_number CHECK (((hole_number > 0) AND (hole_number <= 50))),
    CONSTRAINT check_strokes CHECK (((strokes > 0) AND (strokes <= 20)))
);


--
-- Name: TABLE scores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.scores IS 'Player scores per hole (par looked up from round_hole_pars table)';


--
-- Name: side_bet_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.side_bet_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    side_bet_id uuid NOT NULL,
    player_id uuid NOT NULL,
    is_winner boolean DEFAULT false,
    won_at timestamp without time zone,
    declared_by_id uuid,
    joined_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE side_bet_participants; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.side_bet_participants IS 'Players participating in each side bet';


--
-- Name: COLUMN side_bet_participants.is_winner; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bet_participants.is_winner IS 'Whether this participant won the bet';


--
-- Name: COLUMN side_bet_participants.won_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bet_participants.won_at IS 'Timestamp when participant was declared winner';


--
-- Name: COLUMN side_bet_participants.declared_by_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bet_participants.declared_by_id IS 'Player who declared this participant as winner';


--
-- Name: side_bets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.side_bets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    round_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    bet_type character varying(200) NOT NULL,
    hole_number integer,
    created_by_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    cancelled_at timestamp without time zone,
    cancelled_by_id uuid,
    bet_category character varying(50),
    CONSTRAINT check_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT check_hole_number CHECK (((hole_number IS NULL) OR ((hole_number > 0) AND (hole_number <= 50))))
);


--
-- Name: TABLE side_bets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.side_bets IS 'Side bets created by players during a round (e.g., closest to pin, longest drive)';


--
-- Name: COLUMN side_bets.bet_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bets.bet_type IS 'User-defined bet type as free-form text';


--
-- Name: COLUMN side_bets.hole_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bets.hole_number IS 'Specific hole number for hole-based bets, NULL for round-long bets';


--
-- Name: COLUMN side_bets.cancelled_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bets.cancelled_at IS 'Timestamp when bet was cancelled, NULL if active';


--
-- Name: COLUMN side_bets.cancelled_by_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bets.cancelled_by_id IS 'Player who cancelled the bet';


--
-- Name: COLUMN side_bets.bet_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.side_bets.bet_category IS 'Standardized bet category for analytics. NULL for legacy bets, will be pattern-matched later. Validation happens in application layer for flexibility.';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: friendship_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests ALTER COLUMN id SET DEFAULT nextval('public.friendship_requests_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: bag_contents bag_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_pkey PRIMARY KEY (id);


--
-- Name: bags bags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bags
    ADD CONSTRAINT bags_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: disc_master disc_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disc_master
    ADD CONSTRAINT disc_master_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: friendship_requests friendship_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_pkey PRIMARY KEY (id);


--
-- Name: round_hole_pars round_hole_pars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_hole_pars
    ADD CONSTRAINT round_hole_pars_pkey PRIMARY KEY (id);


--
-- Name: round_players round_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_pkey PRIMARY KEY (id);


--
-- Name: rounds rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_pkey PRIMARY KEY (id);


--
-- Name: scores scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_pkey PRIMARY KEY (id);


--
-- Name: side_bet_participants side_bet_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bet_participants
    ADD CONSTRAINT side_bet_participants_pkey PRIMARY KEY (id);


--
-- Name: side_bets side_bets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bets
    ADD CONSTRAINT side_bets_pkey PRIMARY KEY (id);


--
-- Name: friendship_requests unique_friendship; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT unique_friendship UNIQUE (requester_id, recipient_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_bag_contents_bag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_bag_id ON public.bag_contents USING btree (bag_id);


--
-- Name: idx_bag_contents_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_brand ON public.bag_contents USING btree (brand) WHERE (brand IS NOT NULL);


--
-- Name: idx_bag_contents_disc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_disc_id ON public.bag_contents USING btree (disc_id);


--
-- Name: idx_bag_contents_is_lost; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_is_lost ON public.bag_contents USING btree (is_lost);


--
-- Name: idx_bag_contents_lost_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_lost_at ON public.bag_contents USING btree (lost_at);


--
-- Name: idx_bag_contents_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_model ON public.bag_contents USING btree (model) WHERE (model IS NOT NULL);


--
-- Name: idx_bag_contents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bag_contents_user_id ON public.bag_contents USING btree (user_id);


--
-- Name: idx_bags_is_friends_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bags_is_friends_visible ON public.bags USING btree (is_friends_visible);


--
-- Name: idx_bags_is_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bags_is_public ON public.bags USING btree (is_public);


--
-- Name: idx_bags_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bags_user_id ON public.bags USING btree (user_id);


--
-- Name: idx_courses_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_approved ON public.courses USING btree (approved);


--
-- Name: idx_courses_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_city ON public.courses USING btree (city);


--
-- Name: idx_courses_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_country ON public.courses USING btree (country);


--
-- Name: idx_courses_country_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_country_city ON public.courses USING btree (country, city);


--
-- Name: idx_courses_country_state_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_country_state_province ON public.courses USING btree (country, state_province);


--
-- Name: idx_courses_is_user_submitted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_is_user_submitted ON public.courses USING btree (is_user_submitted);


--
-- Name: idx_courses_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_location ON public.courses USING btree (latitude, longitude);


--
-- Name: idx_courses_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_pending ON public.courses USING btree (is_user_submitted, reviewed_at) WHERE ((is_user_submitted = true) AND (reviewed_at IS NULL));


--
-- Name: idx_courses_state_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_state_province ON public.courses USING btree (state_province);


--
-- Name: idx_disc_master_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disc_master_approved ON public.disc_master USING btree (approved);


--
-- Name: idx_disc_master_brand_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disc_master_brand_model ON public.disc_master USING btree (brand, model);


--
-- Name: idx_friendship_requests_recipient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendship_requests_recipient_id ON public.friendship_requests USING btree (recipient_id);


--
-- Name: idx_round_hole_pars_round_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_round_hole_pars_round_id ON public.round_hole_pars USING btree (round_id);


--
-- Name: idx_round_hole_pars_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_round_hole_pars_unique ON public.round_hole_pars USING btree (round_id, hole_number);


--
-- Name: idx_round_players_round_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_round_players_round_id ON public.round_players USING btree (round_id);


--
-- Name: idx_round_players_unique_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_round_players_unique_user ON public.round_players USING btree (round_id, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_round_players_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_round_players_user_id ON public.round_players USING btree (user_id);


--
-- Name: idx_rounds_course_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rounds_course_id ON public.rounds USING btree (course_id);


--
-- Name: idx_rounds_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rounds_created_by ON public.rounds USING btree (created_by_id);


--
-- Name: idx_rounds_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rounds_start_time ON public.rounds USING btree (start_time);


--
-- Name: idx_rounds_starting_hole; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rounds_starting_hole ON public.rounds USING btree (starting_hole);


--
-- Name: idx_rounds_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rounds_status ON public.rounds USING btree (status);


--
-- Name: idx_scores_hole_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scores_hole_number ON public.scores USING btree (hole_number);


--
-- Name: idx_scores_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scores_player_id ON public.scores USING btree (player_id);


--
-- Name: idx_scores_round_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scores_round_id ON public.scores USING btree (round_id);


--
-- Name: idx_scores_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_scores_unique ON public.scores USING btree (round_id, player_id, hole_number);


--
-- Name: idx_side_bet_participants_player_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_side_bet_participants_player_id ON public.side_bet_participants USING btree (player_id);


--
-- Name: idx_side_bet_participants_side_bet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_side_bet_participants_side_bet_id ON public.side_bet_participants USING btree (side_bet_id);


--
-- Name: idx_side_bet_participants_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_side_bet_participants_unique ON public.side_bet_participants USING btree (side_bet_id, player_id);


--
-- Name: idx_side_bets_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_side_bets_category ON public.side_bets USING btree (bet_category);


--
-- Name: idx_side_bets_created_by_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_side_bets_created_by_id ON public.side_bets USING btree (created_by_id);


--
-- Name: idx_side_bets_hole_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_side_bets_hole_number ON public.side_bets USING btree (hole_number);


--
-- Name: idx_side_bets_round_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_side_bets_round_id ON public.side_bets USING btree (round_id);


--
-- Name: idx_user_profiles_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_country ON public.user_profiles USING btree (country);


--
-- Name: idx_user_profiles_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_created_at ON public.user_profiles USING btree (created_at);


--
-- Name: idx_user_profiles_state_province; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_state_province ON public.user_profiles USING btree (state_province);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_users_last_password_change; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_password_change ON public.users USING btree (last_password_change);


--
-- Name: bag_contents bag_contents_bag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_bag_id_fkey FOREIGN KEY (bag_id) REFERENCES public.bags(id) ON DELETE SET NULL;


--
-- Name: bag_contents bag_contents_disc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_disc_id_fkey FOREIGN KEY (disc_id) REFERENCES public.disc_master(id) ON DELETE CASCADE;


--
-- Name: bag_contents bag_contents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bag_contents
    ADD CONSTRAINT bag_contents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bags bags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bags
    ADD CONSTRAINT bags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: courses courses_submitted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_submitted_by_id_fkey FOREIGN KEY (submitted_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: disc_master disc_master_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disc_master
    ADD CONSTRAINT disc_master_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: courses fk_courses_reviewed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fk_courses_reviewed_by FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: friendship_requests friendship_requests_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendship_requests friendship_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendship_requests
    ADD CONSTRAINT friendship_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: round_hole_pars round_hole_pars_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_hole_pars
    ADD CONSTRAINT round_hole_pars_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;


--
-- Name: round_hole_pars round_hole_pars_set_by_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_hole_pars
    ADD CONSTRAINT round_hole_pars_set_by_player_id_fkey FOREIGN KEY (set_by_player_id) REFERENCES public.round_players(id) ON DELETE CASCADE;


--
-- Name: round_players round_players_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;


--
-- Name: round_players round_players_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.round_players
    ADD CONSTRAINT round_players_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rounds rounds_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;


--
-- Name: rounds rounds_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rounds
    ADD CONSTRAINT rounds_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: scores scores_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.round_players(id) ON DELETE CASCADE;


--
-- Name: scores scores_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;


--
-- Name: side_bet_participants side_bet_participants_declared_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bet_participants
    ADD CONSTRAINT side_bet_participants_declared_by_id_fkey FOREIGN KEY (declared_by_id) REFERENCES public.round_players(id) ON DELETE CASCADE;


--
-- Name: side_bet_participants side_bet_participants_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bet_participants
    ADD CONSTRAINT side_bet_participants_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.round_players(id) ON DELETE CASCADE;


--
-- Name: side_bet_participants side_bet_participants_side_bet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bet_participants
    ADD CONSTRAINT side_bet_participants_side_bet_id_fkey FOREIGN KEY (side_bet_id) REFERENCES public.side_bets(id) ON DELETE CASCADE;


--
-- Name: side_bets side_bets_cancelled_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bets
    ADD CONSTRAINT side_bets_cancelled_by_id_fkey FOREIGN KEY (cancelled_by_id) REFERENCES public.round_players(id) ON DELETE CASCADE;


--
-- Name: side_bets side_bets_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bets
    ADD CONSTRAINT side_bets_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.round_players(id) ON DELETE CASCADE;


--
-- Name: side_bets side_bets_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.side_bets
    ADD CONSTRAINT side_bets_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

