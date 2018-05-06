CREATE TABLE IF NOT EXISTS "_meta"."FileColumns" (
    "id" uuid DEFAULT uuid_generate_v4(),
    "schemaName" varchar NOT NULL,
    "tableName" varchar NOT NULL,
    "columnName" varchar NOT NULL,
    "types" jsonb NOT NULL,
    PRIMARY KEY ("id"),
    UNIQUE ("schemaName", "tableName", "columnName")
);