import logger from "../logger";
import { TColumnOptions } from "../types";
import adjustEnum from "./adjustEnum";

export default function checkAndAdjustColumnOptions(input: TColumnOptions): TColumnOptions {
  const columnOptions: TColumnOptions = JSON.parse(JSON.stringify(input));

  adjustEnum(columnOptions);

  logger.info(JSON.stringify(columnOptions));

  return columnOptions;
}
