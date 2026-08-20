-- Not applied automatically (no migration framework is wired up) - run
-- manually against the target database once.

-- Login brute-force lockout, separate from the existing password-reset
-- attempt counter (resetAttempts/resetBlockedUntil) which only guards the
-- 6-digit reset code, not the login endpoint itself.
ALTER TABLE users
    ADD COLUMN failedLoginAttempts INT NOT NULL DEFAULT 0,
    ADD COLUMN lockedUntil DATETIME NULL DEFAULT NULL;
