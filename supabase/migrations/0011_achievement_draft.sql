-- Free-text scratch pad on an Achievement for draft/backup write-ups that
-- haven't been formalised as a Master Wording or used in an application.
-- Deliberately not a wording: no versioning, no Job Types, never copied into
-- a Workspace or Application Wording unless the user does so by hand.

alter table achievements add column draft text;
