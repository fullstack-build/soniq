export const GET_TRIGGERS = `
SELECT * FROM information_schema.triggers WHERE event_object_schema = $1 AND event_object_table = $2 AND trigger_name LIKE 'updatedAt_trigger_%';
`;
