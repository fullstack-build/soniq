set local jwt.claims.user_id to 1;

SELECT json_agg(row_to_json(t)) json FROM
(SELECT 
COALESCE("User_Author".id, "User_Me".id) id, 
COALESCE("User_Author"."firstLetterOfUserName", "User_Me"."firstLetterOfUserName", null) "firstLetterOfUserName", 
COALESCE("User_Me".username, null) username,
CASE 
WHEN "User_Me".id IS NOT NULL THEN 'User_Me'
WHEN "User_Author".id IS NOT NULL THEN 'User_Authors'
ELSE 'User_Author'
END "__typename"
FROM "User_Author" FULL OUTER JOIN "User_Me" on "User_Author".id = "User_Me".id) t