-- is_user_authentication_valid function checks if every provider used in loginProviderSets and modifyProviderSets has an AuthFactor
CREATE OR REPLACE FUNCTION _auth.is_user_authentication_valid(i_user_authentication_id TEXT) RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_auth_factor_providers TEXT;
    v_auth_factor_providers_array TEXT[];
    v_query TEXT;
    v_providers TEXT[];
    v_login_provider_sets TEXT[];
    v_modify_provider_sets TEXT[];
    v_provider_set TEXT;
    v_provider_set_sorted TEXT;
    v_provider_set_array TEXT[];
    v_provider_set_array_sorted TEXT[];
    v_provider TEXT;
BEGIN
    -- Check if the user is admin. Raise exeption if not.
    v_is_admin := _auth.is_admin();
    IF v_is_admin = FALSE THEN
        RAISE EXCEPTION 'AUTH.THROW.FORBIDDEN_ERROR: You are not permitted to execute this operation.';
    END IF;

	  SELECT value INTO v_auth_factor_providers FROM _meta."Auth" WHERE key = 'auth_factor_providers';
    v_auth_factor_providers_array := regexp_split_to_array(v_auth_factor_providers, ':');
    
    v_query := $tok$ SELECT ARRAY(SELECT provider FROM _auth."AuthFactor" WHERE "userAuthenticationId" = %L AND "deletedAt" IS NULL); $tok$;
    EXECUTE format(v_query, i_user_authentication_id) INTO v_providers;

    FOREACH v_provider IN ARRAY v_providers
    LOOP
      IF NOT v_provider = ANY (v_auth_factor_providers_array) THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Provider (%) is not allowed.', v_provider;
      END IF;
    END LOOP;

    v_query := $tok$ SELECT "loginProviderSets", "modifyProviderSets" FROM _auth."UserAuthentication" WHERE id = %L; $tok$;
    EXECUTE format(v_query, i_user_authentication_id) INTO v_login_provider_sets, v_modify_provider_sets;

    FOREACH v_provider_set IN ARRAY v_login_provider_sets
    LOOP
      v_provider_set_array := regexp_split_to_array(v_provider_set, ':');
    
 	    v_provider_set_array_sorted := _auth.array_sort(v_provider_set_array);
 	    v_provider_set_sorted := array_to_string(v_provider_set_array_sorted, ':');
 	  
      IF v_provider_set != v_provider_set_sorted THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: ProviderSet (%) is incorrect sorted.', v_provider_set;
      END IF;
      
      FOREACH v_provider IN ARRAY v_provider_set_array
      LOOP
        IF NOT v_provider = ANY (v_providers) THEN
          RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Provider (%) is not defined in any AuthFactor of the user.', v_provider;
        END IF;
      END LOOP;
    END LOOP;
    
    FOREACH v_provider_set IN ARRAY v_modify_provider_sets
    LOOP
      v_provider_set_array := regexp_split_to_array(v_provider_set, ':');
    
 	    v_provider_set_array_sorted := _auth.array_sort(v_provider_set_array);
 	    v_provider_set_sorted := array_to_string(v_provider_set_array_sorted, ':');
 	  
      IF v_provider_set != v_provider_set_sorted THEN
        RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: ProviderSet (%) is incorrect sorted.', v_provider_set;
      END IF;
      
      FOREACH v_provider IN ARRAY v_provider_set_array
      LOOP
        IF NOT v_provider = ANY (v_providers) THEN
          RAISE EXCEPTION 'AUTH.THROW.USER_INPUT_ERROR: Provider (%) is not defined in any AuthFactor of the user.', v_provider;
        END IF;
      END LOOP;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;