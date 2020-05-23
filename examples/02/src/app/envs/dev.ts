import { SoniqEnvironment } from "soniq";

export const dev: SoniqEnvironment = new SoniqEnvironment("dev", {
  user: "postgres",
  host: "localhost",
  database: "soniq-dev",
  password: "",
  port: 5432,
});
