🏠 Mini Buyer Lead Intake App

A lightweight Buyer Lead Intake & Management app built with Vite + React + TypeScript + shadcn-ui + Tailwind CSS + Supabase.
It allows capturing, listing, searching, editing, and managing buyer leads with validation, history tracking, and CSV import/export.

**Tech Stack**

Frontend: Vite
 + React
 + TypeScript

UI: shadcn-ui
 + Tailwind CSS

Database & Auth: Supabase
 (Postgres + Auth)

Validation: Zod

State/Data: Supabase client + React Query (if added)

CSV Handling: Papaparse (or custom util)

Testing: Vitest (unit tests)

**Features**
*Buyers (Leads)*

+Capture buyer details with Zod-based validation (client + server).

+Enums for city, propertyType, bhk, purpose, timeline, source, status.

+Ownership: users can only edit/delete their own buyers (ownerId).

+Buyer history table tracks last 5 changes (field, old → new, timestamp, user).

*Pages & Flows*

+Create Lead – /buyers/new

  Form with validation: name, phone, city, propertyType, etc.
  
  Conditional field: bhk required only for Apartment/Villa.
  
  On submit → creates record + buyer_history entry.

+List & Search – /buyers

  Server-side pagination (10/page).
  
  Filters synced to URL (city, propertyType, status, timeline).
  
  Debounced search (fullName|phone|email).
  
  Sort by updatedAt desc.
  
  Row actions: View / Edit.

+View & Edit – /buyers/[id]

  Edit form with same validation rules.
  
  Optimistic concurrency check using updatedAt.
  
  Shows last 5 history entries.

+CSV Import/Export

  Row-level validation (show errors in table).
  
  Transactional insert of valid rows only.
  
  Export applies current filters/search/sort.

**Auth & Ownership**

+Supabase Auth (magic link or demo login).

+Any logged-in user can read all buyers.

+Users can edit/delete only their own (ownerId).


**Validation & Safety**

+Zod validation both client & server.

+Budget validation: budgetMax ≥ budgetMin.

+Conditional validation: bhk required for Apartment/Villa.

+Rate limiting on create/update (simple per-user/IP).

+Ownership enforcement at API layer.

**Database**

+Supabase provides Postgres.

+Run migrations (via SQL or Supabase migration tool).

+Schema includes:

  buyers
  
  buyer_history
  
  users (handled by Supabase Auth)


**Design Notes**

+Validation lives in a shared schemas/ folder (Zod) → reused on client + server.

+SSR for listing with filters/search/sort handled server-side.

+Ownership checks enforced in Supabase policies.

+Buyer history maintained by triggers or app logic.

**What’s Done vs Skipped
Done**

+Full CRUD with validation

+Pagination, search, filters, sort

+Import/export with validation

+Ownership checks via Supabase policies

+Unit test (CSV row validator)

+Accessibility basics (labels, focus, ARIA for errors)

**Skipped**

+Advanced full-text search

+File uploads (attachmentUrl)

-Admin role (only owner-based auth enforced)
