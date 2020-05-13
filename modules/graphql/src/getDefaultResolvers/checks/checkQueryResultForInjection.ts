import { Logger } from "soniq";
import { UserInputError } from "../../GraphqlErrors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const data: object = result[0];
  const keys: string[] = Object.keys(data);
  if (keys.length > 1) {
    logger.error("InjectionProtector:", "Successful SQL-Injection Attack. To many columns in result. Request denied.");
    throw new UserInputError("InjectionProtector: To many columns.");
  }
}
