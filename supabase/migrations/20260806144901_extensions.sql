-- Phase 2 — extensions
-- pgcrypto provides gen_random_uuid(); typically already enabled on Supabase
-- projects, declared explicitly here so this migration is self-contained.
create extension if not exists pgcrypto;
