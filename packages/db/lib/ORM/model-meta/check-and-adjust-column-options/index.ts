import { Container } from "@fullstack-one/di";
import { LoggerFactory, ILogger } from "@fullstack-one/logger";
import { TColumnOptions } from "../types";
import adjustEnum from "./adjustEnum";

const loggerFactory = Container.get(LoggerFactory);
const logger: ILogger = loggerFactory.create("OrmModelMeta.CheckAndAdjustColumnOptions");

export default function checkAndAdjustColumnOptions(input: TColumnOptions): TColumnOptions {
  const columnOptions: TColumnOptions = JSON.parse(JSON.stringify(input));

  adjustEnum(columnOptions, logger);

  logger.info(JSON.stringify(columnOptions));

  return columnOptions;
}
