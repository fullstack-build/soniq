CREATE TABLE IF NOT EXISTS "_meta"."Files" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "extension" varchar NOT NULL,
    "ownerUserId" uuid NOT NULL,
    "entityId" uuid,
    "deleted" timestamp without time zone,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    UNIQUE ("id")
);
