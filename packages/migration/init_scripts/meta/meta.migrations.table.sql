CREATE TABLE IF NOT EXISTS "_meta"."migrations" (
    "id" serial,
    "created_at" date DEFAULT now(),
    "version" float,
    "state" jsonb,
    PRIMARY KEY ("id")
);
