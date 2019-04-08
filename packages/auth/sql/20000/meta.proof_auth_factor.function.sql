-- proof_auth_factor function checks provided AuthFactor and sets the proofedAt Date if not already set.
CREATE OR REPLACE FUNCTION _meta.proof_auth_factor(i_auth_factor jsonb) RETURNS void AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_hash_secret TEXT;    

    v_query TEXT;
    v_user_authentication_id TEXT;

    v_auth_factor_id TEXT;
    v_auth_factor_hash TEXT;
    v_auth_factor_created_at TEXT;
    v_auth_factor_provider TEXT;
    v_validation_hash TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _meta.is_admin();
    IF v_is_admin = FALSE THEN
        -- RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;
    
    SELECT value INTO v_hash_secret FROM _meta."Auth" WHERE key = 'hash_secret';

    -- First get some data
    v_query := $tok$ SELECT "userAuthenticationId", "hash", "provider" FROM "_meta"."AuthFactor" WHERE "id" = %L AND "deletedAt" IS NULL; $tok$;
    EXECUTE format(v_query, i_auth_factor->>'id') INTO v_user_authentication_id, v_auth_factor_hash, v_auth_factor_provider;

    -- Check if anything is NULL
    IF v_user_authentication_id IS NULL OR v_auth_factor_hash IS NULL THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Proof failed! AuthFactor invalid.';
    END IF;

    -- create a new hash based on the old one because it includes a salt
    v_validation_hash := crypt(encode(digest(i_auth_factor->>'hash' || v_hash_secret, 'sha256'), 'hex'), v_auth_factor_hash);

    IF v_auth_factor_hash != v_validation_hash THEN
       RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Proof failed! AuthFactor hash not matching.';
    END IF;
      
    v_query := $tok$ UPDATE "_meta"."AuthFactor" SET "proofedAt" = COALESCE("proofedAt", timezone('UTC'::text, now())) WHERE "id" = %L; $tok$;
    EXECUTE format(v_query, i_auth_factor->>'id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;