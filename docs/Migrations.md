# Migration behaviour 

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
  * enums cannot be renamed
  * if an enum change is detected, it will be marked as `add` and `remove` to force an recreation + all columns using this enum will be marked `changed` to force a recast
  * if a table got renamed and has constraints/indexes, this constraints/indexes will get renamed as well    
  * if a table got renamed and has relations, check if this relatiosn got changed
    * if other properties got change -> ignore -> will force a recreation of relation (drop and create)
    * if no other changes -> just rename relation
* Iterate this delta object with actions `migrationObj` and use the final state `toDbMeta` as a reference to create an `sqlObject` (with `up` and `down`):
* Iterate `sqlMigrationObj` in a certain order in order to create SQL statement in the correct order
  * only add statements to the SQL statements array, if they are not in the array already (e.g. create schema only once, even for multiple tables)  
  

## schema
### create schema
Schemas are never explicitly created. They are created implicitly (IF NOT EXISTS) together with tables.

### delete schema


## enum
### create enum

### rename enum

### change enum values

### delete enum

## table
### create table

### rename table

### move table to other schema

### delete table

## column
### create column

### change column type

### change column constraint/index

### rename column

### delete column


## Relations

### create relation 1:n

### change relation 1:n

### remove relation 1:n

### create relation n:m

### change relation n:m

### remove relation n:m 
