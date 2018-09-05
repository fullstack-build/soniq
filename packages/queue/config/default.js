module.exports = {
  queue: {
// leaving this settings out will use a connection from the general pool
//    database: 'fullstack-one-example',
//    host: 'localhost',
//    user: 'postgres',
//    password: 'postgres',
//    poolSize: 1,
    archiveCompletedJobsEvery: '2 days',
    schema: 'queue'
  }
};
