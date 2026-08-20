-- Not applied automatically (no migration framework is wired up) - run
-- manually against the target database once.

-- Minimal activity log for admin/back-office actions: who did what, when.
CREATE TABLE activitylogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NULL,
    userEmail VARCHAR(255) NULL,
    role VARCHAR(20) NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    createdAt DATETIME NOT NULL
);
