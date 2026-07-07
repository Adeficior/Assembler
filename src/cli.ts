#!/usr/bin/env bun

import { packFormatOf } from "@adeficior/data-modifier";
import { generateDumpTypes } from "@adeficior/data-modifier/cli";
import {
  combineResolvers,
  createCombinedResolver,
  createResolver,
  type Resolver,
} from "@adeficior/pack-resolver";
import { exists } from "fs/promises";
import { join } from "path";
import { generateResources, mergeResources } from ".";
import getArguments from "./args";
import { uploadToModrinth } from "./publish/modrinth";
import cloneReferences from "./references";
import { generateGlobalTypes } from "./types";

async function run() {
  const { actions, logger, pack, ...args } = await getArguments();

  if (actions.includes("prepare")) {
    const typesDir = join(args.cacheDir, "@types");
    await Promise.all([
      generateGlobalTypes(typesDir, logger),
      generateDumpTypes("dump", typesDir, logger),
    ]);
  }

  const packFormat = packFormatOf(pack.versions.minecraft);

  if (actions.includes("generate")) {
    await cloneReferences(args.cacheDir, pack.versions.minecraft, logger);
    await generateResources(
      args.modulesDir,
      args.cacheDir,
      args.generatedOutput,
      {
        logger,
        packFormat,
        failFast: args.failFast,
      },
    );
  }

  if (actions.includes("publish")) {
    if (!pack.version) throw new Error("pack does not have a set version");
    const exportedFile = `${pack.name}-${pack.version}.mrpack`;

    const { projectId, token } = args.modrinth;
    if (!projectId) throw new Error("modrinth project id not passed");
    if (!token) throw new Error("modrinth token not passed");

    await uploadToModrinth(pack, exportedFile, projectId, token);
  }

  if (actions.includes("merge")) {
    // TODO mergingAcceptor
    const resolvers: Promise<Resolver>[] = [];
    if (await exists(args.resourcesDir))
      resolvers.push(
        createCombinedResolver({ from: args.resourcesDir, logger }),
      );
    if (await exists(args.generatedOutput))
      resolvers.push(createResolver({ from: args.generatedOutput, logger }));

    if (resolvers.length === 0) {
      throw new Error("no resources to merge");
    }

    await mergeResources(
      combineResolvers(await Promise.all(resolvers)),
      args.packDir,
      { cacheDir: args.cacheDir },
    );
  }

  logger.info("Done!");
}

/* eslint-disable no-console */
try {
  await run();
  process.exit(0);
} catch (e) {
  if (e instanceof Error) console.error(e.message);
  else console.error("an unknown error occured");
  process.exit(1);
}
/* eslint-enable no-console */
