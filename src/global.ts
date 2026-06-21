import type { Logger, PackLoader } from "@pssbletrngle/data-modifier";

export type ModuleGlobalContext = {
  loader: PackLoader;
  logger: Logger;
  moduleName: string;
};
