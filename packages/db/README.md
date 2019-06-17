# @fullstack-one/db
Packages for managing connections to Postgres

This package includes a service for a postgres pool, called [DbGeneralPool](lib/DbGeneralPool/index.ts). The pool is used for GraphQl requests. Morover this package includes an ORM subpackage based on [typeorm](https://www.typeorm.io), which has its own pool. Other packages and the application can use the query runners of ORM using `const queryRunner = orm.createQueryRunner(); await queryRunner.connect(); queryRunner.query("SELECT ...")`.

The pool size is gracefully adjusted depending on the number of connected nodes using `@fullstack-one/events`.