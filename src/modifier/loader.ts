import type { PackLoader } from "@adeficior/data-modifier";
import { extendLoggerContext, listChildren } from "@adeficior/pack-resolver";
import { extname } from "path";
import { join } from "path/posix";
import { pathToFileURL } from "url";
import type { Options } from "../args";
import { logError } from "../error";
import type { ModuleGlobalContext } from "../global";

const globalContext = global as unknown as ModuleGlobalContext;

type LoadOptions = Pick<Options, "failFast" | "logger">;

async function loadModule(name: string, path: string, options: LoadOptions) {
  try {
    options.logger.debug(`loading ${path}...`);
    globalContext.moduleName = name;
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
  const children = await listChildren(join(from, dir));

  let total = 0;
  for (const it of children) {
    if (it.info.isDirectory()) {
      total += await loadModulesRecursive(from, options, it.name);
    } else if (
      it.info.isFile() &&
      [".js", ".mjs", ".ts", ".mts"].includes(extname(it.path))
    ) {
      const name = join(dir, it.name.slice(0, -3));

      const loaded = await loadModule(name, it.path, {
        ...options,
        logger: extendLoggerContext(options.logger, { module: it.path }),
      });

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
  options: LoadOptions,
) {
  globalContext.loader = loader;
  globalContext.logger = options.logger;

  const loaded = await loadModulesRecursive(from, options);
  options.logger.info(`loaded ${loaded} modules`);
}
