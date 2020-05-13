import { Container, Core, Logger } from "soniq";
import { Server } from "@soniq/server";
import { GraphQl } from "@soniq/graphql";
import { Auth, AuthProviderEmail, AuthProviderPassword, IUserAuthentication, IProofMailPayload } from "@soniq/auth";

export const $auth: Auth = Container.get(Auth);
export const $core: Core = Container.get(Core);
export const $gql: GraphQl = Container.get(GraphQl);
export const $server: Server = Container.get(Server);
export const $authProviderEmail: AuthProviderEmail = Container.get(AuthProviderEmail);
export const $authProviderPassword: AuthProviderPassword = Container.get(AuthProviderPassword);
// export const $fileStorage: FileStorage = Container.get(FileStorage);

const logger: Logger = $core.getLogger("Root");

$auth.registerUserRegistrationCallback((userAuthentication: IUserAuthentication) => {
  logger.info("user.registered", JSON.stringify(userAuthentication, null, 2));
});

$authProviderEmail.registerSendMailCallback((mail: IProofMailPayload) => {
  logger.info("authProviderEmail.sendMailCallback", JSON.stringify(mail, null, 2));
});
