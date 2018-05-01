# Migration flow 

* Postgres is reflected into a dbMeta Object `fromDbMeta`
* GraphQL Schema is parsed to a dbMeta Object `toDbMeta`
* A delta object `migrationObj` is recursively creating out of `fromDbMeta` and `toDbMeta`, each node is marked with an action:
    * In both, `fromDbMeta` and in `toDbMeta`
      * check if object is similar?
        * similar: no change => `remove`
        * not similar => mark as `change`   
    * In `fromDbMeta` but not in `toDbMeta` = remove > mark with action `remove`
    * In `toDbMeta` but not in `fromDbMeta` = add > mark with action `add`
  * this delta object `migrationObj` is iterated again and renamed tables, columns and detected based on the availability of `oldName`
  * renamed nodes (tables and columns) are combined into one and marked as `rename`
  * enums will not be renamed and recreated instead
  * if an enum change is detected, it will be marked as `add` and `remove` to force an recreation + all columns using this enum will be marked as a `change` to force a recast
  * if a table got renamed and has constraints/indexes, this constraints/indexes will get renamed as well    
  * if a table got renamed and has relations, check if this relation got changed
    * if other properties got change -> ignore -> will force a recreation of relation (drop and create)
    * if no other changes -> just rename relation
* Iterate this delta object with actions `migrationObj` and use the final state `toDbMeta` as a reference to create an `sqlObject` (with `up` and `down`):
* Iterate `sqlMigrationObj` in a certain order in order to create SQL statement in the correct order
  * only add statements to the SQL statements array, if they are not in the array already (e.g. create schema only once, even for multiple tables)  
  
*Rename instead of drop*: `renameInsteadOfDrop`: bool
There are two ways of running a migration: 
* `renameInsteadOfDrop` is `true`: (default) Soft delete. Schemas, tables, columns will not be deleted but prefixed instead. All relations, constraint, indexes and types will be removed.
* `renameInsteadOfDrop` is `false`: Hard delete. Schemas, tables, columns will be permanently dropped.

## schema
### create schema
Schemas are never explicitly created. They are created implicitly (IF NOT EXISTS) together with tables.

### rename schema
Schemas are not being renamed. They are recreated and dropped.

### delete schema
As soon as a schema becomes empty (no tables) it will get dropped.

## table
### create table
* Tables will also implicitly create needed schemas they should be placed in.
* Each table will create a corresponding updatable view with the name `V{TABLE_NAME}`. This view is used fo restricted access with a valid user. Direct table access should be forbidden.      

#### basic example

*GraphQL schema:*
```
type NewTable @table {
}
```

*SQL result:*
```
CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE "public"."NewTable"();
```

#### Different names for GraphQL type and Postgres table name:


*GraphQL schema:*
```
type NewTable @table(tableName: "OtherName") {
} 
```

*SQL result:*
```
CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE "public"."OtherName"();
```

#### Define another schema than `public`


*GraphQL schema:*
```
type NewTable @table(schemaName: "NewSchema") {
} 
```

*SQL result:*
```
CREATE SCHEMA IF NOT EXISTS "NewSchema";
CREATE TABLE "NewSchema"."NewTable"();
```


### rename table


*GraphQL schema:*
```
type RenamedTable @table @migrate(from: "NewTable"){
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" RENAME TO "RenamedTable";
```

### move table to other schema
Tables can also be moved to other schemas. 
A schema will implicitly be deleted as soon as the last table gets deleted or moved from schema.
If a new schema was defined, it will implicitly be created. 
It is possible to rename a table and move it into a new schema at the same time (as well as change its columns, etc.)

*GraphQL schema:*
```
type NewTable @table(schemaName: "NewSchema") @migrate(fromSchema: "public"){
}
```

*SQL result:*
```
CREATE SCHEMA IF NOT EXISTS "NewSchema";
ALTER TABLE "public"."NewTable" SET SCHEMA "NewSchema";
```


### delete table
When deleted a table, a schema (as long as it's not `public`) will also be deleted in case it's the last table in in. 

*GraphQL schema:*
```
# type NewTable @table(schemaName: "NewSchema") {
# }
```

*SQL result:*
```
ALTER TABLE "NewSchema"."NewTable" RENAME TO "_deleted:NewTable";
ALTER SCHEMA "NewSchema" RENAME TO "_deleted:NewSchema";
```

## column
*Each modification is run as a separate statement.* This allows us to perform even the smallest adjustment. 

### create column
Each column is created as a `varchar` type and casted to the actual type in the following statement.


#### Primary keys
*Only ID primary keys of type UUIDv4 with expression `uuid_generate_v4()` are supported for now*


*GraphQL schema:*
```
type NewTable @table{
  id: ID!
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ADD COLUMN "id" varchar;
ALTER TABLE "public"."NewTable" ALTER COLUMN "id" TYPE "uuid" USING "id"::"uuid";
ALTER TABLE "public"."NewTable" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
ALTER TABLE "public"."NewTable" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "public"."NewTable" ADD CONSTRAINT "NewTable_id_pkey" PRIMARY KEY ("id");
```

#### Simple `varchar` example:

*GraphQL schema:*
```
type NewTable @table{
  id: ID!
  name: String
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ADD COLUMN "name" varchar;
```

#### Example of a new `bool` column with an `NOT NULL` constraint. 

*GraphQL schema:*
```
type NewTable @table{
  id: ID!
  name: String
  isFunny: Boolean!
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ADD COLUMN "isFunny" varchar;
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "bool" USING "isFunny"::"bool";
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" SET NOT NULL;
```

### change column type
A type cast will always be performed directly from old type to new type in the database. 
Since it's not possible to cast every type into any other type, it will sometimes fail, e.g. when casting a `bool` into a `jsonb`.

*Negative example: Casting `bool` to `jsonb` (will fail):*
```
type NewTable @table{
  id: ID!
  name: String
  isFunny: JSON!
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "jsonb" USING "isFunny"::"jsonb";
```

*Error:*
```
ERROR:  cannot cast type boolean to jsonb
LINE 1: ...LTER COLUMN "isFunny" TYPE "jsonb" USING "isFunny"::"jsonb";
```

*Positive example: casting `bool` to `varchar` (will work):*

```
type NewTable @table{
  id: ID!
  name: String
  isFunny: String!
}
```

*SQL result:*

```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "varchar" USING "isFunny"::"varchar";
```

*Casting back from `varchar` to `bool` will also work.*


### change column constraint/index
Every constraint and index can be added and removed at any time.

*GraphQL schema:*
```
type NewTable @table{
  id: ID!
  name: String
  isFunny: Boolean @unique
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" DROP NOT NULL;
ALTER TABLE "public"."NewTable" ADD CONSTRAINT "NewTable_isFunny_key" UNIQUE ("isFunny");
```


### constraint/index across multiple columns
When providing a name, a constraint can also be applied to multiple columns.


*GraphQL schema:*
```
type NewTable @table{
  id: ID!
  name: String @unique(name: "multiColumnUniquenessName")
  isFunny: Boolean @unique(name: "multiColumnUniquenessName")
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" DROP NOT NULL;
ALTER TABLE "public"."NewTable" ADD CONSTRAINT "NewTable_multiColumnUniquenessName_key" UNIQUE ("name","isFunny");
```

### rename column
Each column can be renamed.

```
type NewTable @table{
  id: ID!
  name: String
  isVeryFunny: Boolean @migrate(from:"isFunny")
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" RENAME COLUMN "isFunny" TO "isVeryFunny";
```


### delete column
Each column can be simply removed from schema. 


*GraphQL schema:*
```
type NewTable @table{
  id: ID!
  name: String
  # isVeryFunny: Boolean @migrate(from:"isFunny")
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" RENAME COLUMN "isVeryFunny" TO "_deleted:isVeryFunny";
```

## enum types

### create enum
All enum types will be created in the public schema and are accessible from every column.

*GraphQL schema example:*
```
enum NewEnum {
  yes
  no
}

type NewTable @table{
  id: ID!
  name: String
  isFunny: NewEnum
}
```

*SQL result:*
```
CREATE TYPE "NewEnum" AS ENUM ('yes','no');
ALTER TABLE "public"."NewTable" ADD COLUMN "isFunny" varchar;
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "NewEnum" USING "isFunny"::"NewEnum";
```


### rename enum
Enums will not be actually renamed, they will be re-created instead. 
* All columns that still point to the old enum name will be casted into `varchar`.
* All columns that were pointing to the old enum name and now point to the new name, will be casted to `varchar` first and after the new enum was created, casted to the new enum name.


*GraphQL schema example:*
```
enum RenamedEnum {
  yes
  no
}

type NewTable @table{
  id: ID!
  name: String
  isFunny: RenamedEnum
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "varchar" USING "isFunny"::"varchar";
DROP TYPE "NewEnum";
CREATE TYPE "RenamedEnum" AS ENUM ('yes','no');
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "RenamedEnum" USING "isFunny"::"RenamedEnum";
```


### change enum values
Enum types will not be changed (because there is no proper way to remove values, only add new ones). 
They will be recreated instead.

* Cast columns using this enum to `varchar`.
* Drop enum type with old values. 
* Create enum  type with new values. 
* Case columns back to new enum type.  



*GraphQL schema example:*
```
enum RenamedEnum {
  yes
  no
  maybe
}

type NewTable @table{
  id: ID!
  name: String
  isFunny: RenamedEnum
}
```

*SQL result:*
```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "varchar" USING "isFunny"::"varchar";
DROP TYPE "RenamedEnum";
CREATE TYPE "RenamedEnum" AS ENUM ('yes','no','maybe');
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "RenamedEnum" USING "isFunny"::"RenamedEnum";
```

### delete enum
*Enum types will always be dropped, even if `renameInsteadOfDrop` is `true`, becuase they don't contain any actual data.*

* Cast all relying columns to varchar.
* Drop enum type.

*GraphQL schema example:*
```
#enum RenamedEnum {
#  yes
#  no
#  maybe
#}

type NewTable @table{
  id: ID!
  name: String
  isFunny: String
}
``` 


*SQL result:*
```
ALTER TABLE "public"."NewTable" ALTER COLUMN "isFunny" TYPE "varchar" USING "isFunny"::"varchar";
DROP TYPE "RenamedEnum";
```



## Relations

Given tables:
*GraphQL Example:*
```
type Table1 @table{
  id: ID!
  name: String
  table2: Table2! @relation(name:"Table1ToTable2" onDelete: "restrict", onUpdate: "cascade")
}


type Table2 @table {
  id: ID!
  name: String
}
```

*SQL result:*
```
CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE "public"."Table1"();
ALTER TABLE "public"."Table1" ADD COLUMN "id" varchar;
ALTER TABLE "public"."Table1" ALTER COLUMN "id" TYPE "uuid" USING "id"::"uuid";
ALTER TABLE "public"."Table1" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
ALTER TABLE "public"."Table1" ADD COLUMN "name" varchar;
ALTER TABLE "public"."Table1" ALTER COLUMN "name" TYPE "varchar" USING "name"::"varchar";
ALTER TABLE "public"."Table1" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "public"."Table1" ADD CONSTRAINT "Table1_id_pkey" PRIMARY KEY ("id");
CREATE TABLE "public"."Table2"();
ALTER TABLE "public"."Table2" ADD COLUMN "id" varchar;
ALTER TABLE "public"."Table2" ALTER COLUMN "id" TYPE "uuid" USING "id"::"uuid";
ALTER TABLE "public"."Table2" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
ALTER TABLE "public"."Table2" ADD COLUMN "name" varchar;
ALTER TABLE "public"."Table2" ALTER COLUMN "name" TYPE "varchar" USING "name"::"varchar";
ALTER TABLE "public"."Table2" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "public"."Table2" ADD CONSTRAINT "Table2_id_pkey" PRIMARY KEY ("id");
```

### 1:n
*Only 1:n relations are officially supported for now.* 

### create relation 1:n

A 1:n relation can, but does not *have to* point in both directions. It is totally fine to create only the 1:n part of it.
On delete and on update behaviour can also be specified for each relation.

Some additional meta information about this relations will be stored as a json comment for this relation.

*GraphQL Example:*
```
type PrivateTable1 @table(schemaName:"private") @migrate(from: "Table1" fromSchema: "public"){
  ...
  table2: Table2! @relation(name:"Table1ToTable2" onDelete: "restrict", onUpdate: "cascade")
}


type Table2 @table {
  ...
  table1: [Table1!]! @relation(name:"Table1ToTable2")
}

```

*SQL result:*
```
ALTER TABLE "public"."Table1" ADD COLUMN IF NOT EXISTS "table2Id" uuid;
ALTER TABLE "public"."Table1" DROP CONSTRAINT IF EXISTS "fk_Table1ToTable2" CASCADE;
ALTER TABLE "public"."Table1" ADD CONSTRAINT "fk_Table1ToTable2" FOREIGN KEY ("table2Id") REFERENCES "public"."Table2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMENT ON CONSTRAINT "fk_Table1ToTable2" ON "public"."Table1" IS '{"public.Table1":{"name":"Table1ToTable2","type":"ONE","schemaName":"public","tableName":"Table1","columnName":"table2Id","virtualColumnName":"table2","onUpdate":"CASCADE","onDelete":"RESTRICT","description":null,"reference":{"schemaName":"public","tableName":"Table2","columnName":"id"}},"public.Table2":{"name":"Table1ToTable2","type":"MANY","schemaName":"public","tableName":"Table2","columnName":null,"virtualColumnName":"table1s","onUpdate":null,"onDelete":null,"description":null,"reference":{"schemaName":"public","tableName":"Table1","columnName":null}}}';
```

When renaming a table (and/or moving to another schema) each relation will be adjusted accordingly:

*GraphQL example:*
```
type PrivateTable1 @table(schemaName:"private") @migrate(from: "Table1" fromSchema: "public"){
...
}
```

*SQL result:*
```
CREATE SCHEMA IF NOT EXISTS "private";
ALTER TABLE "public"."Table1" SET SCHEMA "private";
ALTER TABLE "private"."Table1" RENAME TO "PrivateTable1";
ALTER INDEX "private"."Table1_id_pkey" RENAME TO "PrivateTable1_id_pkey";
ALTER TABLE "private"."PrivateTable1" ADD COLUMN IF NOT EXISTS "table2Id" uuid;
ALTER TABLE "private"."PrivateTable1" DROP CONSTRAINT IF EXISTS "fk_Table1ToTable2" CASCADE;
ALTER TABLE "private"."PrivateTable1" ADD CONSTRAINT "fk_Table1ToTable2" FOREIGN KEY ("table2Id") REFERENCES "public"."Table2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMENT ON CONSTRAINT "fk_Table1ToTable2" ON "private"."PrivateTable1" IS '{"private.PrivateTable1":{"name":"Table1ToTable2","type":"ONE","schemaName":"private","tableName":"PrivateTable1","columnName":"table2Id","virtualColumnName":"table2","onUpdate":"CASCADE","onDelete":"RESTRICT","description":null,"reference":{"schemaName":"public","tableName":"Table2","columnName":"id"}},"public.Table2":{"name":"Table1ToTable2","type":"MANY","schemaName":"public","tableName":"Table2","columnName":null,"virtualColumnName":"privatetable1s","onUpdate":null,"onDelete":null,"description":null,"reference":{"schemaName":"private","tableName":"PrivateTable1","columnName":null}}}';
```


### change relation 1:n
A simple change of a relation (e.g. `onDelete`, `onUpdate`) will recreate the relation *WITHOUT* losing any foreign keys.

*Caution:* Changing the Name of a relation causes a full recreation, which could lead to losing foreign keys. 
If you wish to rename a relation, you would have to do it manually in the database. 
This feature will be added with one of the upcoming updates (//todo for later). 

*GraphQL example:*
```
type PrivateTable1 @table(schemaName:"private") @migrate(from: "Table1" fromSchema: "public"){
  ..
  table2: Table2! @relation(name:"Table1ToTable2" onDelete: "restrict", onUpdate: "restrict")
}


type Table2 @table {
  ..
  table1: [Table1!]! @relation(name:"Table1ToTable2")
}
```

*SQL result:*
```
ALTER TABLE "private"."PrivateTable1" ADD COLUMN IF NOT EXISTS "table2Id" uuid;
ALTER TABLE "private"."PrivateTable1" DROP CONSTRAINT IF EXISTS "fk_Table1ToTable2" CASCADE;
ALTER TABLE "private"."PrivateTable1" ADD CONSTRAINT "fk_Table1ToTable2" FOREIGN KEY ("table2Id") REFERENCES "public"."Table2"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMENT ON CONSTRAINT "fk_Table1ToTable2" ON "private"."PrivateTable1" IS '{"private.PrivateTable1":{"name":"Table1ToTable2","type":"ONE","schemaName":"private","tableName":"PrivateTable1","columnName":"table2Id","virtualColumnName":"table2","onUpdate":"RESTRICT","onDelete":"RESTRICT","description":null,"reference":{"schemaName":"public","tableName":"Table2","columnName":"id"}},"public.Table2":{"name":"Table1ToTable2","type":"MANY","schemaName":"public","tableName":"Table2","columnName":null,"virtualColumnName":"privatetable1s","onUpdate":null,"onDelete":null,"description":null,"reference":{"schemaName":"private","tableName":"PrivateTable1","columnName":null}}}';
```


### remove relation 1:n


*GraphQL example:*
```
type PrivateTable1 @table(schemaName:"private") @migrate(from: "Table1" fromSchema: "public"){
  ..
  # table2: Table2! @relation(name:"Table1ToTable2" onDelete: "restrict", onUpdate: "restrict")
}


type Table2 @table {
  ..
  # table1: [Table1!]! @relation(name:"Table1ToTable2")
}
```

*SQL result:*
```
ALTER TABLE "private"."PrivateTable1" RENAME COLUMN "table2Id" TO "_deleted:table2Id";
ALTER TABLE "private"."PrivateTable1" DROP CONSTRAINT IF EXISTS "fk_Table1ToTable2" CASCADE;
```


### n:m
*BETA*

*Default:*
Many-to-many relations will be automatically created as two `ARRAY` lists of foreign keys. 
This proves to be a faster and more memory efficient than creating MTM-tables.   

Sources: 
* http://blog.j0.hn/post/57492309635/using-arrays-as-relation-tables-in-postgres
* https://medium.com/@leshchuk/mtm-on-arrays-in-postgresql-a97f3c50b8c6

If you still want to create a many-to-many relationship based on tables (because you might want to store some additional data), 
you would have to create it manually with two 1:n relations.

*Caution:* Since this feature is still in *beta* we do not support setting `onUpdate` and `onDelete` or checking its relational integrity.

### create relation n:m

*GraphQL example:*
```
type Table1 @table{
  ...
  table2: [Table2!]! @relation(name:"Table1ToTable2")
}


type Table2 @table {
  ...
  table1: [Table1!]! @relation(name:"Table1ToTable2")
}
```

*SQL result:*
```
ALTER TABLE "public"."Table1" ADD COLUMN "table2IdsArray" uuid[];
COMMENT ON COLUMN "public"."Table1"."table2IdsArray" IS '{"name":"Table1ToTable2","type":"MANY","schemaName":"public","tableName":"Table1","columnName":"table2IdsArray","virtualColumnName":"table2","reference":{"schemaName":"public","tableName":"Table2","columnName":"id"}}';
ALTER TABLE "public"."Table2" ADD COLUMN "table1IdsArray" uuid[];
COMMENT ON COLUMN "public"."Table2"."table1IdsArray" IS '{"name":"Table1ToTable2","type":"MANY","schemaName":"public","tableName":"Table2","columnName":"table1IdsArray","virtualColumnName":"table1","reference":{"schemaName":"public","tableName":"Table1","columnName":"id"}}';
```

### change relation n:m
Will re-create relation.

### remove relation n:m 


*GraphQL example:*
```
type Table1 @table{
  ...
  # table2: [Table2!]! @relation(name:"Table1ToTable2")
}


type Table2 @table {
  ...
  # table1: [Table1!]! @relation(name:"Table1ToTable2")
}
```

*SQL result:*
```
ALTER TABLE "public"."Table2" RENAME COLUMN "table1IdsArray" TO "_deleted:table1IdsArray";
ALTER TABLE "public"."Table1" RENAME COLUMN "table2IdsArray" TO "_deleted:table2IdsArray";
```