import { TColumnOptions } from "../types";
import adjustEnum from "./adjustEnum";

export default function checkAndAdjustColumnOptions(columnOptions: TColumnOptions): TColumnOptions {
  adjustEnum(columnOptions);

  return columnOptions;
}
