CREATE TABLE IF NOT EXISTS "_meta"."Files" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" timestamp without time zone NOT NULL DEFAULT timezone('UTC'::text, now()),
    "extension" varchar NOT NULL,
    "type" varchar NOT NULL,
    "ownerUserId" uuid NOT NULL,
    "entityId" uuid,
    "verifiedAt" timestamp without time zone,
    "deletedAt" timestamp without time zone,
    PRIMARY KEY ("id"),
    UNIQUE ("id")
);
