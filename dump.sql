--
-- PostgreSQL database dump
--

\restrict DKeiVreMn2YlarfefXrGzIuutB3r4hiessTcj342mLccuxt4FSPnveIbPcnue4M

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: action_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.action_plans (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description character varying(5000),
    version integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.action_plans OWNER TO postgres;

--
-- Name: action_status_changes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.action_status_changes (
    action_id uuid NOT NULL,
    "position" integer NOT NULL,
    from_status character varying(20) NOT NULL,
    to_status character varying(20) NOT NULL,
    changed_by uuid NOT NULL,
    changed_at timestamp with time zone NOT NULL,
    reason text,
    CONSTRAINT ck_action_status_changes_from CHECK (((from_status)::text = ANY ((ARRAY['TODO'::character varying, 'IN_PROGRESS'::character varying, 'TO_VALIDATE'::character varying, 'DONE'::character varying])::text[]))),
    CONSTRAINT ck_action_status_changes_to CHECK (((to_status)::text = ANY ((ARRAY['TODO'::character varying, 'IN_PROGRESS'::character varying, 'TO_VALIDATE'::character varying, 'DONE'::character varying])::text[])))
);


ALTER TABLE public.action_status_changes OWNER TO postgres;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actions (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description character varying(5000),
    status character varying(20) NOT NULL,
    version integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT ck_actions_status CHECK (((status)::text = ANY ((ARRAY['TODO'::character varying, 'IN_PROGRESS'::character varying, 'TO_VALIDATE'::character varying, 'DONE'::character varying])::text[])))
);


ALTER TABLE public.actions OWNER TO postgres;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.memberships (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    version integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    removed_at timestamp with time zone,
    removed_by uuid,
    CONSTRAINT ck_memberships_role CHECK (((role)::text = ANY ((ARRAY['MEMBER'::character varying, 'MANAGER'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.memberships OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(254) NOT NULL,
    email_key character varying(254) NOT NULL,
    name character varying(200) NOT NULL,
    password_hash text NOT NULL,
    must_change_password boolean NOT NULL,
    sessions_valid_after timestamp with time zone,
    version integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: action_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.action_plans (id, organization_id, title, description, version, created_at) FROM stdin;
bf63b2c7-4244-4508-9a12-f42b6eb32c6a	55deef59-f2f1-48ef-a299-b7303d3c253d	Prévention des infections associées aux soins	Suite à l’audit hygiène des mains de mars : taux d’observance de 62 %, objectif 80 %.	1	2026-10-07 20:57:53.558+00
02795dec-d8ea-4799-b58d-ddc119c02f09	55deef59-f2f1-48ef-a299-b7303d3c253d	Sécurisation du circuit du médicament	Plan issu de la revue des erreurs médicamenteuses (CREX du 2e trimestre).	1	2026-10-07 20:57:54.07+00
dfd17144-82e1-471e-a428-4a789e159b67	55deef59-f2f1-48ef-a299-b7303d3c253d	Identitovigilance	\N	1	2026-10-07 20:57:54.257+00
\.


--
-- Data for Name: action_status_changes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.action_status_changes (action_id, "position", from_status, to_status, changed_by, changed_at, reason) FROM stdin;
f3d6598f-bd4b-4f6e-b26a-e3009ae27266	0	TODO	IN_PROGRESS	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:53.701+00	\N
f3d6598f-bd4b-4f6e-b26a-e3009ae27266	1	IN_PROGRESS	TO_VALIDATE	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:53.746+00	\N
f3d6598f-bd4b-4f6e-b26a-e3009ae27266	2	TO_VALIDATE	DONE	ac8a219c-9c12-478c-b21e-ec559cd1244d	2026-10-07 20:57:53.779+00	\N
020716b7-b403-4711-9c34-b6f81e75e520	0	TODO	IN_PROGRESS	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:53.825+00	\N
020716b7-b403-4711-9c34-b6f81e75e520	1	IN_PROGRESS	TO_VALIDATE	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:53.871+00	\N
020716b7-b403-4711-9c34-b6f81e75e520	2	TO_VALIDATE	IN_PROGRESS	ac8a219c-9c12-478c-b21e-ec559cd1244d	2026-10-07 20:57:53.918+00	Il manque les chambres du 3e étage : compléter avant validation.
020716b7-b403-4711-9c34-b6f81e75e520	3	IN_PROGRESS	TO_VALIDATE	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:53.964+00	\N
84e4d8bd-dfad-4d47-abdd-ed73f75d5813	0	TODO	IN_PROGRESS	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:54.012+00	\N
5b90c960-cc5c-475a-922e-2be27fee832c	0	TODO	IN_PROGRESS	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:54.165+00	\N
cf50ea5b-8c5c-4646-ae26-e5f365cff8be	0	TODO	IN_PROGRESS	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:54.212+00	\N
cf50ea5b-8c5c-4646-ae26-e5f365cff8be	1	IN_PROGRESS	TO_VALIDATE	2a0fb3c8-c12b-422d-bec0-fc138823531f	2026-10-07 20:57:54.244+00	\N
\.


--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actions (id, organization_id, plan_id, title, description, status, version, created_at, deleted_at, deleted_by) FROM stdin;
f5a96b58-1cef-430d-aac9-ad0a97476c59	55deef59-f2f1-48ef-a299-b7303d3c253d	bf63b2c7-4244-4508-9a12-f42b6eb32c6a	Afficher les 5 indications de l’hygiène des mains	\N	TODO	1	2026-10-07 20:57:53.635+00	\N	\N
f3d6598f-bd4b-4f6e-b26a-e3009ae27266	55deef59-f2f1-48ef-a299-b7303d3c253d	bf63b2c7-4244-4508-9a12-f42b6eb32c6a	Former les nouveaux arrivants à l’hygiène des mains	Session mensuelle de 30 min avec caisson pédagogique.	DONE	4	2026-10-07 20:57:53.575+00	\N	\N
020716b7-b403-4711-9c34-b6f81e75e520	55deef59-f2f1-48ef-a299-b7303d3c253d	bf63b2c7-4244-4508-9a12-f42b6eb32c6a	Installer des distributeurs de SHA à l’entrée des chambres	\N	TO_VALIDATE	5	2026-10-07 20:57:53.605+00	\N	\N
84e4d8bd-dfad-4d47-abdd-ed73f75d5813	55deef59-f2f1-48ef-a299-b7303d3c253d	bf63b2c7-4244-4508-9a12-f42b6eb32c6a	Réaliser un audit d’observance trimestriel	Grille OMS, 100 opportunités par service.	IN_PROGRESS	2	2026-10-07 20:57:53.618+00	\N	\N
1963748d-83fe-4d7d-b176-64c8b04d855e	55deef59-f2f1-48ef-a299-b7303d3c253d	bf63b2c7-4244-4508-9a12-f42b6eb32c6a	Commander des affiches (doublon)	\N	TODO	2	2026-10-07 20:57:53.667+00	2026-10-07 20:57:54.057+00	ac8a219c-9c12-478c-b21e-ec559cd1244d
acaf17ce-9e0c-49d3-97fa-e33336790001	55deef59-f2f1-48ef-a299-b7303d3c253d	02795dec-d8ea-4799-b58d-ddc119c02f09	Mettre à jour la liste des médicaments à haut risque	\N	TODO	1	2026-10-07 20:57:54.118+00	\N	\N
5b90c960-cc5c-475a-922e-2be27fee832c	55deef59-f2f1-48ef-a299-b7303d3c253d	02795dec-d8ea-4799-b58d-ddc119c02f09	Mettre en place le double contrôle des médicaments à risque	\N	IN_PROGRESS	2	2026-10-07 20:57:54.086+00	\N	\N
cf50ea5b-8c5c-4646-ae26-e5f365cff8be	55deef59-f2f1-48ef-a299-b7303d3c253d	02795dec-d8ea-4799-b58d-ddc119c02f09	Tracer la température des réfrigérateurs de service	\N	TO_VALIDATE	3	2026-10-07 20:57:54.102+00	\N	\N
993fb5c4-c90f-4c47-836c-01c9cb92185c	55deef59-f2f1-48ef-a299-b7303d3c253d	dfd17144-82e1-471e-a428-4a789e159b67	Vérifier le port du bracelet d’identification à l’admission	\N	TODO	1	2026-10-07 20:57:54.274+00	\N	\N
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.memberships (id, organization_id, user_id, role, version, created_at, removed_at, removed_by) FROM stdin;
e2134041-b888-4132-8ff4-ea85e66bd225	55deef59-f2f1-48ef-a299-b7303d3c253d	ac8a219c-9c12-478c-b21e-ec559cd1244d	ADMIN	1	2026-10-07 20:57:50.61+00	\N	\N
8d8ed4b0-198e-4d78-8ed8-e8498af4e803	55deef59-f2f1-48ef-a299-b7303d3c253d	2a0fb3c8-c12b-422d-bec0-fc138823531f	MANAGER	1	2026-10-07 20:57:50.932+00	\N	\N
a060611f-df1b-46e7-ac62-2e209b7e3f05	55deef59-f2f1-48ef-a299-b7303d3c253d	1b52d3ca-2915-4ca3-93b5-ae29368f5455	MEMBER	1	2026-10-07 20:57:52.27+00	\N	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1791400377863	Init1791400377863
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, created_at) FROM stdin;
55deef59-f2f1-48ef-a299-b7303d3c253d	Clinique des Lilas	2026-10-07 20:57:50.61+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, email_key, name, password_hash, must_change_password, sessions_valid_after, version, created_at) FROM stdin;
ac8a219c-9c12-478c-b21e-ec559cd1244d	alice@lilas.test	alice@lilas.test	Alice Martin	scrypt$131072$8$1$dnSJg/aog3xO9Q3XfhfnAw==$sJAVTVVtXCo7GgnBZGpWy7HXVEnxzxW9qY0vjTNatjk=	f	\N	1	2026-10-07 20:57:50.61+00
2a0fb3c8-c12b-422d-bec0-fc138823531f	bob@lilas.test	bob@lilas.test	Bob Durand	scrypt$131072$8$1$pcENdlm2Ce0r+6saMMmfQA==$bLO0gpfVWx+auSCR/24fvtMTMmtR5Q5Y+f+sMz30gV8=	f	2026-10-07 20:57:52.007+00	2	2026-10-07 20:57:50.932+00
1b52d3ca-2915-4ca3-93b5-ae29368f5455	chloe@lilas.test	chloe@lilas.test	Chloé Petit	scrypt$131072$8$1$jxMGoxp19Myzp6B78Gnaug==$j23JIQWQ44fP5PLIeAPKaOtHbeVUw1dhYSneCcQsc2k=	f	2026-10-07 20:57:53.289+00	2	2026-10-07 20:57:52.27+00
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, true);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: action_plans pk_action_plans; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT pk_action_plans PRIMARY KEY (id);


--
-- Name: action_status_changes pk_action_status_changes; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_status_changes
    ADD CONSTRAINT pk_action_status_changes PRIMARY KEY (action_id, "position");


--
-- Name: actions pk_actions; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT pk_actions PRIMARY KEY (id);


--
-- Name: memberships pk_memberships; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT pk_memberships PRIMARY KEY (id);


--
-- Name: organizations pk_organizations; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT pk_organizations PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: action_plans uq_action_plans_id_organization; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT uq_action_plans_id_organization UNIQUE (id, organization_id);


--
-- Name: users uq_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email_key UNIQUE (email_key);


--
-- Name: ix_action_plans_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_action_plans_organization ON public.action_plans USING btree (organization_id, created_at);


--
-- Name: ix_actions_plan; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_actions_plan ON public.actions USING btree (organization_id, plan_id, created_at);


--
-- Name: ix_memberships_organization; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_memberships_organization ON public.memberships USING btree (organization_id, created_at);


--
-- Name: uq_memberships_active_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_memberships_active_user ON public.memberships USING btree (user_id) WHERE (removed_at IS NULL);


--
-- Name: action_plans fk_action_plans_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_plans
    ADD CONSTRAINT fk_action_plans_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: action_status_changes fk_action_status_changes_action; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_status_changes
    ADD CONSTRAINT fk_action_status_changes_action FOREIGN KEY (action_id) REFERENCES public.actions(id) ON DELETE RESTRICT;


--
-- Name: action_status_changes fk_action_status_changes_changed_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_status_changes
    ADD CONSTRAINT fk_action_status_changes_changed_by FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: actions fk_actions_deleted_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT fk_actions_deleted_by FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: actions fk_actions_plan_same_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT fk_actions_plan_same_organization FOREIGN KEY (plan_id, organization_id) REFERENCES public.action_plans(id, organization_id) ON DELETE RESTRICT;


--
-- Name: memberships fk_memberships_organization; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT fk_memberships_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: memberships fk_memberships_removed_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT fk_memberships_removed_by FOREIGN KEY (removed_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: memberships fk_memberships_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict DKeiVreMn2YlarfefXrGzIuutB3r4hiessTcj342mLccuxt4FSPnveIbPcnue4M

