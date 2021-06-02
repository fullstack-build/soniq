import { SoniqEnvironment } from "soniq";

export const dev: SoniqEnvironment = new SoniqEnvironment("development", {
  user: "postgres",
  host: "localhost",
  database: "soniq-dev-3",
  password: "",
  port: 5432,
});
