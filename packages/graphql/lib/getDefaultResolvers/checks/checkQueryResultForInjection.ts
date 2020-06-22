import { Logger } from "@fullstack-one/logger";
import { UserInputError } from "../../GraphqlErrors";

export default function checkQueryResultForInjection(result: any[], logger: Logger): void {
  if (result == null) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many queries in result. Request denied.");
    throw new UserInputError("InjectionProtector: To many queries.");
  }
  if (result.length > 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many rows in result. Request denied.");
    throw new UserInputError("InjectionProtector: To many rows.");
  }
  if (result.length < 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To less rows in result. Request denied.");
    throw new UserInputError("InjectionProtector: To less rows.");
  }
  const data = result[0];
  const keys = Object.keys(data);
  if (keys.length > 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many columns in result. Request denied.");
    throw new UserInputError("InjectionProtector: To many columns.");
  }
}
