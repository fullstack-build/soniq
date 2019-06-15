import { TColumnOptions } from "../types";
import adjustEnum from "./adjustEnum";

export default function checkAndAdjustColumnOptions(input: TColumnOptions): TColumnOptions {
  const columnOptions: TColumnOptions = JSON.parse(JSON.stringify(input));

  adjustEnum(columnOptions);

  return columnOptions;
}
