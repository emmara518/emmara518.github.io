DO $$
BEGIN
	CREATE EXTENSION IF NOT EXISTS pgcrypto;
	UPDATE "sessions"
	SET "token" = encode(digest("token", 'sha256'), 'hex')
	WHERE "token" !~ '^[0-9a-f]{64}$';
EXCEPTION
	WHEN feature_not_supported OR undefined_function OR insufficient_privilege THEN
		RAISE NOTICE 'Session hash migration skipped: pgcrypto unavailable; application compatibility bridge remains active.';
END $$;
