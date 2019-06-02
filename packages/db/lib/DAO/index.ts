import * as massive from "massive";
import { Service, Inject, Container } from "@fullstack-one/di";

@Service()
export class DAO {
  constructor() {
    massive({
      host: "localhost",
      port: 5432,
      database: "fullstack-one-example",
      user: "postgres",
      password: ""
    }).then((db) => {
      console.log("****", db);
    });
  }
}
