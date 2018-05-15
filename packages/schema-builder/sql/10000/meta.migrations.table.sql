CREATE TABLE IF NOT EXISTS "_meta"."migrations" (
    "id" serial,
    "created_at" timestamp DEFAULT now(),
    "version" varchar,
    "state" jsonb,
    PRIMARY KEY ("id")
);
