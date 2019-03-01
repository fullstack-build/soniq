# @fullstack-one/db
Packages for managing connections to Postgres

This package includes a service for a single postgres client, called [DbAppClient](lib/DbAppClient/index.ts), and a service for a postgres pool, called [DbGeneralPool](lib/DbGeneralPool/index.ts). The DbAppClient should be used for application internal stuff, whilst the pool is used for GraphQl requests.

The pool size can be gracefully adjusted from the outside, for example using `@fullstack-one/db-auto-scaling`.