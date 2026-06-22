import type { PackLoader } from "@adeficior/data-modifier";
import type { Logger } from "@adeficior/pack-resolver";

export type ModuleGlobalContext = {
  loader: PackLoader;
  logger: Logger;
  moduleName: string;
};
