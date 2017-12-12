CREATE OR REPLACE FUNCTION public.current_user()
    RETURNS "User"
    LANGUAGE 'sql'

    COST 100
    STABLE
AS 
$BODY$

  select *
  from public."User"
  where id = current_setting('jwt.claims.user_id')::uuid

$BODY$;