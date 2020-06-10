import { DI, Core, Logger } from "soniq";
import { Server } from "@soniq/server";
import { GraphQl } from "@soniq/graphql";
import { Auth, AuthProviderEmail, AuthProviderPassword, IUserAuthentication, IProofMailPayload } from "@soniq/auth";

export const $auth: Auth = DI.container.resolve(Auth);
export const $core: Core = DI.container.resolve(Core);
export const $gql: GraphQl = DI.container.resolve(GraphQl);
export const $server: Server = DI.container.resolve(Server);
export const $authProviderEmail: AuthProviderEmail = DI.container.resolve(AuthProviderEmail);
export const $authProviderPassword: AuthProviderPassword = DI.container.resolve(AuthProviderPassword);
// export const $fileStorage: FileStorage = Container.get(FileStorage);

const logger: Logger = $core.getLogger("Root");

$auth.registerUserRegistrationCallback((userAuthentication: IUserAuthentication) => {
  logger.info("user.registered", JSON.stringify(userAuthentication, null, 2));
});

$authProviderEmail.registerSendMailCallback((mail: IProofMailPayload) => {
  logger.info("authProviderEmail.sendMailCallback", JSON.stringify(mail, null, 2));
});
