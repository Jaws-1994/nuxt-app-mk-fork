-- Sessions d'authentification (révocables).
-- Distincte de la table `session` du dump (parties / quiz).
-- ID_user est INT UNSIGNED, comme users.ID_user.

CREATE TABLE IF NOT EXISTS auth_sessions (
  ID_auth_session INT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_token_hash CHAR(64) NOT NULL,
  ID_user INT UNSIGNED NOT NULL,
  session_expires_at DATETIME NOT NULL,
  PRIMARY KEY (ID_auth_session),
  UNIQUE KEY uq_auth_session_token_hash (session_token_hash),
  KEY idx_auth_session_user (ID_user),
  KEY idx_auth_session_expires (session_expires_at),
  CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (ID_user) REFERENCES users (ID_user)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
