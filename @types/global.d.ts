import { Logger, PackLoader } from "@pssbletrngle/data-modifier";

declare global {
  var loader: PackLoader;
  var logger: Logger;
  var moduleName: string;
}
