import { SoniqEnvironment } from "soniq";
import { AuthModuleOverwrite } from "@soniq/auth";

export const prod: SoniqEnvironment = new SoniqEnvironment("production", {
  user: "postgres",
  host: "localhost",
  database: "soniq-prod",
  password: "",
  port: 5432,
});

prod.addAppConfigOverwrite(
  new AuthModuleOverwrite({
    isServerBehindProxy: true,
    authFactorProofTokenMaxAgeInSeconds: 42323,
  })
);
