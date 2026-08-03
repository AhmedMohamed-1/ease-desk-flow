ALTER TABLE public.tickets ALTER COLUMN priority DROP DEFAULT;

CREATE TYPE public.ticket_priority_new AS ENUM ('low', 'medium', 'high');

ALTER TABLE public.tickets
  ALTER COLUMN priority TYPE public.ticket_priority_new
  USING priority::text::public.ticket_priority_new;

DROP TYPE public.ticket_priority;

ALTER TYPE public.ticket_priority_new RENAME TO ticket_priority;

ALTER TABLE public.tickets ALTER COLUMN priority SET DEFAULT 'medium'::ticket_priority;