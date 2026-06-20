import { type Logger, PackLoader } from "@pssbletrngle/data-modifier";
import {
  type Acceptor,
  createMergedResolver,
  createResolver,
} from "@pssbletrngle/pack-resolver";
import { Mergers } from "@pssbletrngle/resource-merger";
import crypto from "crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import loadModules, { type LoadOptions } from "./loader";

function parseCacheFile(path: string) {
  const map = new Map<string, string>();
  const seperator = " ";

  if (existsSync(path)) {
    readFileSync(path)
      .toString()
      .split("\n")
      .map((it) => it.trim())
      .filter((it) => it.includes(seperator))
      .map((it) => it.split(seperator) as [string, string])
      .forEach(([path, hash]) => {
        map.set(path, hash);
      });
  }

  return map;
}

function createHash(content: string | Buffer): string {
  const hash = crypto.createHash("md5");
  hash.setEncoding("hex");
  hash.write(content);
  hash.end();
  return hash.read();
}

function createCache(output: string) {
  const cacheFile = join(output, "cache");
  const lastCache = parseCacheFile(cacheFile);
  const nextCache = new Map<string, string>();

  const matches = (path: string, content: string | Buffer) => {
    const hash = createHash(content);
    nextCache.set(path, hash);
    return lastCache.get(path) === hash;
  };

  const emit = () => {
    const encoded = [...nextCache.entries()]
      .map(([key, value]) => `${key} ${value}`)
      .join("\n");
    writeFileSync(cacheFile, encoded);
  };

  const orphans = () => {
    return [...lastCache.keys()]
      .filter((it) => !nextCache.has(it))
      .map((it) => join(output, it))
      .filter((it) => existsSync(it));
  };

  return { matches, emit, orphans };
}

function createAcceptor(logger: Logger, output: string) {
  const cache = createCache(output);

  const cachedDatapack: Acceptor = (path, content) => {
    if (cache.matches(path, content)) return true;
    return writeToDatapack(path, content);
  };

  const datapackMergers = new Mergers({ output, overwrite: true }, {});
  const writeToDatapack = datapackMergers.createAcceptor();

  const writeToConfig: Acceptor = (path, content) => {
    writeFileSync(resolve("..", "config", path), content.toString());
  };

  const accept: Acceptor = (path, content) => {
    if (path.startsWith("jei")) return writeToConfig(path, content);
    else return cachedDatapack(path, content);
  };

  const finalize = async () => {
    await datapackMergers.finalize();

    cache.emit();
    const orphans = cache.orphans();
    if (orphans.length > 0) {
      logger.info(`Removing ${orphans.length} orphan files`);
      orphans.forEach((it) => rmSync(it));
    }
  };

  return { accept, finalize, cache };
}

export default async function modifyResources(
  modulesDir: string,
  options?: Partial<LoadOptions>,
) {
  const resolver = createMergedResolver({
    from: ["../install/mods", "reference"],
    include: ["data/**/*.json", "assets/**/*.json"],
    silent: true,
  });

  const output = createAcceptor(logger, "../resources/modified");

  // TODO pass options in
  const loader = new PackLoader(logger, {
    packFormat: 48,
    hideFrom: ["jei"],
  });

  // TODO move to loader
  loader.registerRegistry("minecraft:worldgen/biome");

  const dumpDir = resolve("..", "dump");
  if (existsSync(dumpDir)) {
    const dump = createResolver({ from: dumpDir, silent: true });
    await loader.loadRegistryDump(dump);
  } else {
    logger.warn("dump directory is missing, ID validation disabled");
  }

  logger.info("loading resources...");
  await loader.loadFrom(resolver);

  logger.info("loading modules...");
  await loadModules(loader, modulesDir, options);

  logger.info("generating modified resources...");
  await loader.emit(output.accept);
  await output.finalize();
}
