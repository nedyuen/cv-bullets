-- Phase 6 follow-up: free-text personal notes on an Achievement, kept
-- separate from `feedback` (which specifically captures feedback from other
-- people on how to present/frame the achievement, not general notes).

alter table achievements add column notes text;
