export const GET_ENUM: string = `
SELECT e.enumlabel "label"
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = $1;
`;
