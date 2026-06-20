import {
  createLogger,
  type Logger,
  PackLoader,
} from "@pssbletrngle/data-modifier";
import { listChildren } from "@pssbletrngle/pack-resolver";
import { extname, resolve } from "path";
import { join } from "path/posix";
import { pathToFileURL } from "url";
import { logError } from "../error";

export type LoadOptions = {
  failFast: boolean;
  logger: Logger;
};

function withGroup(options: LoadOptions): LoadOptions {
  return { ...options, logger: options.logger.group() };
}

async function loadModule(name: string, path: string, options: LoadOptions) {
  try {
    global.moduleName = name;
    await import(pathToFileURL(path).toString());
    return true;
  } catch (error) {
    if (options.failFast) {
      options.logger.error(`error occured loading module '${name}':`);
      throw error;
    }

    logError(options.logger, error, `error occured loading module '${name}'`);
    return false;
  }
}

async function loadModulesRecursive(
  from: string,
  options: LoadOptions,
  dir = ".",
): Promise<number> {
  const children = listChildren(resolve(from, dir));

  let total = 0;
  for (const it of children) {
    if (it.info.isDirectory()) {
      options.logger.info(`${it.name}/`);
      total += await loadModulesRecursive(from, withGroup(options), it.name);
    }

    const ext = extname(__filename);

    if (it.info.isFile() && extname(it.path) === ext) {
      const name = join(dir, it.name.slice(0, -3));

      const loaded = await loadModule(name, it.path, options);

      if (loaded) {
        options.logger.info(`loaded ${it.name}`);
        total++;
      }
    }
  }

  return total;
}

export default async function loadModules(
  loader: PackLoader,
  from: string,
  options: Partial<LoadOptions> = {},
) {
  const resolvedOptions: LoadOptions = {
    logger: createLogger(),
    failFast: true,
    ...options,
  };

  global.loader = loader;
  global.logger = resolvedOptions.logger;

  const loaded = await loadModulesRecursive(from, resolvedOptions);
  logger.info(`loaded ${loaded} modules`);
}
