import { Container } from "@fullstack-one/di";
import { ILogger, LoggerFactory } from "@fullstack-one/logger";

const loggerFactory = Container.get(LoggerFactory);
const logger: ILogger = loggerFactory.create("OrmModelMeta");
export default logger;
