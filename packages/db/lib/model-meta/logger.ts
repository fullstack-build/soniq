import { Container } from "@fullstack-one/di";
import { Logger, LoggerFactory } from "@fullstack-one/logger";

const loggerFactory = Container.get(LoggerFactory);
const logger: Logger = loggerFactory.create("OrmModelMeta");
export default logger;
