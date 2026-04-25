-- ============================================================
-- Migration 007: Profile Privacy Default
-- Depends on: 001 (youth_profiles)
-- Changes is_profile_public default from true → false.
-- Profiles become public automatically when a first submission
-- is published (set in the approveSubmission server action).
-- This follows the same moderation-first philosophy as
-- submissions: nothing is visible without an explicit approval.
-- ============================================================

ALTER TABLE youth_profiles
  ALTER COLUMN is_profile_public SET DEFAULT false;

-- Reset existing rows so dev/test data matches the new policy.
-- In a live production database this would be a separate
-- one-time data migration with careful review.
UPDATE youth_profiles
  SET is_profile_public = false;
