create extension if not exists "pgcrypto";

create table if not exists public.reconciliation_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('rd', 'channel')),
  title text not null,
  statement_month text not null,
  partner_name text not null,
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.reconciliation_documents(id) on delete cascade,
  game_name text not null default '',
  backend_revenue numeric(18,2) not null default 0,
  discount_rate numeric(10,6) not null default 0,
  discounted_revenue numeric(18,2) not null default 0,
  voucher_amount numeric(18,2) not null default 0,
  free_trial_amount numeric(18,2) not null default 0,
  refund_amount numeric(18,2) not null default 0,
  test_fee numeric(18,2) not null default 0,
  welfare_coin numeric(18,2) not null default 0,
  share_rate numeric(10,6) not null default 0,
  tax_rate numeric(10,6) not null default 0,
  channel_fee numeric(18,2) not null default 0,
  billable_amount numeric(18,2) not null default 0,
  share_amount numeric(18,2) not null default 0,
  settlement_amount numeric(18,2) not null default 0,
  sort_order int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reconciliation_documents_type_month
  on public.reconciliation_documents(type, statement_month);

create index if not exists idx_reconciliation_items_document_id
  on public.reconciliation_items(document_id, sort_order);
