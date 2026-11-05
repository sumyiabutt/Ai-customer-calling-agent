-- ShopEasy live voice agent schema (Step A).
-- Run this once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  order_id text primary key,
  status text not null,
  detail text not null,
  expected_delivery text,
  tracking_number text
);

create table if not exists public.faqs (
  id bigserial primary key,
  topic text not null,
  question text not null unique,
  answer text not null
);

create table if not exists public.live_calls (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text unique,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  caller_phone text default 'Web call',
  customer_name text,
  transcript text,
  turns jsonb,
  summary text,
  outcome text default 'info_only'
    check (outcome in ('resolved', 'escalated', 'abandoned', 'info_only')),
  ended_reason text,
  handoff boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.handoffs (
  id uuid primary key default gen_random_uuid(),
  vapi_call_id text,
  customer_name text,
  order_id text,
  issue text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.faqs enable row level security;
alter table public.live_calls enable row level security;
alter table public.handoffs enable row level security;
alter table public.settings enable row level security;

insert into public.orders (order_id, status, detail, expected_delivery, tracking_number) values
  ('ORD-1001', 'Shipped', 'It left the warehouse and is with the courier.', '30 October 2026', 'TRK-SAMPLE-1001'),
  ('ORD-1002', 'Processing', 'Payment is confirmed and the order is being packed.', '2 November 2026', null),
  ('ORD-1003', 'Delivered', 'It was delivered to the address on file on 26 October 2026.', '26 October 2026', 'TRK-SAMPLE-1003'),
  ('ORD-1004', 'Out for delivery', 'It is with the delivery rider and is expected today.', null, 'TRK-SAMPLE-1004'),
  ('ORD-1005', 'Cancelled', 'It was cancelled at the customer request and the refund is in progress.', null, null)
on conflict (order_id) do nothing;

insert into public.faqs (topic, question, answer) values
  ('shipping', 'How long does delivery take?', 'Standard delivery takes 3 to 5 working days after dispatch. Orders placed before 2 PM are usually dispatched the same working day.'),
  ('charges', 'What are the delivery charges?', 'Standard delivery is free for sample orders above 3,000 rupees. Below that, a flat sample fee of 250 rupees applies.'),
  ('returns', 'What is the return policy?', 'You can request a return within 7 days of delivery if the item is unused and in its original packaging. Approved refunds are processed within 5 to 7 working days.'),
  ('payment', 'Which payment methods do you accept?', 'Sample payment methods are cash on delivery, debit or credit card, and bank transfer. Card details are never collected over the phone.'),
  ('warranty', 'Is there a warranty?', 'Sample items carry a 6-month limited warranty that covers manufacturing defects. Damage caused by misuse is not covered.')
on conflict (question) do nothing;
