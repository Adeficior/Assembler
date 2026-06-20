import { type Logger } from "@pssbletrngle/data-modifier";
import { createMergedResolver } from "@pssbletrngle/pack-resolver";
import { Mergers, createDefaultMergers } from "@pssbletrngle/resource-merger";
import { existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";

const baseOutputFolder = resolve("..", "config", "paxi");

const ensureDirectory = (path: string) => {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return path;
};

export default async function mergeResources({ logger }: { logger: Logger }) {
  const resources = createDefaultMergers({
    title: "Modpack Resources",
    output: ensureDirectory(
      join(baseOutputFolder, "resourcepacks", "resources.zip"),
    ),
    packFormat: 9,
    silent: true,
    overwrite: true,
  });

  const data = createDefaultMergers({
    title: "Modpack Resources",
    output: ensureDirectory(
      join(baseOutputFolder, "datapacks", "replaced.zip"),
    ),
    packFormat: 10,
    silent: true,
    overwrite: true,
  });

  const content = createDefaultMergers({
    title: "Modpack Resources",
    output: ensureDirectory("../contentpacks/generated.zip"),
    packFormat: 9,
    silent: true,
    overwrite: true,
  });

  async function run(merger: Mergers, include: string) {
    logger.info(`Merging ${include}...`);
    return merger.run(
      createMergedResolver({ from: "../resources", include, silent: true }),
    );
  }

  await Promise.all([
    run(data, "data/**"),
    run(resources, "assets/**"),
    run(content, "content/**"),
  ]);

  logger.info("Done!");
}
