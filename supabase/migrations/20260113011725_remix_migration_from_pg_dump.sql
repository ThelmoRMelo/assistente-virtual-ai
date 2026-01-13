CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: get_current_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_tenant_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT auth.uid()
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: business_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text,
    business_category text,
    whatsapp_number text,
    payment_link text,
    sale_mode text DEFAULT 'vendedora'::text NOT NULL,
    use_emojis boolean DEFAULT true NOT NULL,
    transfer_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    CONSTRAINT business_config_sale_mode_check CHECK ((sale_mode = ANY (ARRAY['consultiva'::text, 'vendedora'::text, 'fechamento_rapido'::text])))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    product_id uuid,
    is_simulation boolean DEFAULT false NOT NULL,
    negotiation_state jsonb DEFAULT '{"discountAttempts": 0, "hasOfferedDiscount": false, "maxDiscountReached": false, "lastDiscountOffered": null}'::jsonb,
    closing_state jsonb DEFAULT '{"isClosing": false, "closingReason": null, "closingAttempts": 0, "conversationEnded": false, "hasOfferedWhatsApp": false, "hasOfferedPaymentLink": false}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    content text NOT NULL,
    sender text NOT NULL,
    categoria text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_sender_check CHECK ((sender = ANY (ARRAY['user'::text, 'bot'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    category text,
    short_description text,
    long_description text,
    min_price_allowed numeric,
    payment_methods text[],
    delivery_info text,
    image_url text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_link text,
    tenant_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text,
    business_category text,
    whatsapp_number text,
    theme text DEFAULT 'default'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: storefronts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storefronts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    slug text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: business_config business_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_config
    ADD CONSTRAINT business_config_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: storefronts storefronts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storefronts
    ADD CONSTRAINT storefronts_pkey PRIMARY KEY (id);


--
-- Name: storefronts storefronts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storefronts
    ADD CONSTRAINT storefronts_slug_key UNIQUE (slug);


--
-- Name: idx_business_config_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_config_tenant_id ON public.business_config USING btree (tenant_id);


--
-- Name: idx_conversations_closing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_closing ON public.conversations USING btree (((closing_state ->> 'isClosing'::text)));


--
-- Name: idx_conversations_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_session ON public.conversations USING btree (session_id);


--
-- Name: idx_conversations_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_tenant_id ON public.conversations USING btree (tenant_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_products_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_tenant_id ON public.products USING btree (tenant_id);


--
-- Name: idx_storefronts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_storefronts_slug ON public.storefronts USING btree (slug);


--
-- Name: idx_storefronts_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_storefronts_tenant_id ON public.storefronts USING btree (tenant_id);


--
-- Name: business_config update_business_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_business_config_updated_at BEFORE UPDATE ON public.business_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: storefronts update_storefronts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_storefronts_updated_at BEFORE UPDATE ON public.storefronts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations conversations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversations Anyone can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);


--
-- Name: messages Anyone can create messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create messages" ON public.messages FOR INSERT WITH CHECK (true);


--
-- Name: products Anyone can delete products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);


--
-- Name: products Anyone can insert products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);


--
-- Name: conversations Anyone can update conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update conversations" ON public.conversations FOR UPDATE USING (true);


--
-- Name: products Anyone can update products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);


--
-- Name: conversations Anyone can view conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view conversations" ON public.conversations FOR SELECT USING (true);


--
-- Name: messages Anyone can view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);


--
-- Name: products Public can view active products with tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active products with tenant" ON public.products FOR SELECT USING ((active = true));


--
-- Name: storefronts Public can view active storefronts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active storefronts" ON public.storefronts FOR SELECT USING ((is_active = true));


--
-- Name: business_config Public can view business_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view business_config" ON public.business_config FOR SELECT USING (true);


--
-- Name: business_config Tenants can manage own config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage own config" ON public.business_config USING (((tenant_id = auth.uid()) OR (tenant_id IS NULL))) WITH CHECK (((tenant_id = auth.uid()) OR (tenant_id IS NULL)));


--
-- Name: products Tenants can manage own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage own products" ON public.products USING (((tenant_id = auth.uid()) OR (tenant_id IS NULL))) WITH CHECK (((tenant_id = auth.uid()) OR (tenant_id IS NULL)));


--
-- Name: storefronts Tenants can manage own storefront; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can manage own storefront" ON public.storefronts USING ((tenant_id = auth.uid())) WITH CHECK ((tenant_id = auth.uid()));


--
-- Name: conversations Tenants can view own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenants can view own conversations" ON public.conversations FOR SELECT USING (((tenant_id = auth.uid()) OR (tenant_id IS NULL) OR (is_simulation = false)));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: business_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: storefronts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;