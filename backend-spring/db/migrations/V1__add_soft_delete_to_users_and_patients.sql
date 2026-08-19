-- Adds soft-delete support to users and patients. Not applied automatically
-- (no migration framework is wired up) - run manually against the target
-- database once. camelCase to match every other column on these two tables.
--
-- Node/Sequelize always hard-deleted (Patient.destroy() cascades to
-- User.destroy()). The Spring port instead marks rows inactive so a patient
-- with existing appointments/invoices/consultations can be "unsubscribed"
-- without breaking those foreign keys or losing history.

ALTER TABLE users
    ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL;

ALTER TABLE patients
    ADD COLUMN isActive TINYINT(1) NOT NULL DEFAULT 1,
    ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL;
