import {
  distributedAcceptor,
  notNull,
  simpleAcceptor,
  writeToArchive,
  type Acceptor,
  type Resolver,
} from "@adeficior/pack-resolver";
import { join } from "path";

export type MergeOptions = {
  cacheDir?: string;
};

export default async function mergeResources(
  from: Resolver,
  to: string,
  { cacheDir }: Partial<MergeOptions> = {},
) {
  const paxiFolder = join(to, "config", "paxi");

  const acceptors: Record<string, Acceptor> = {};

  const write = async (prefix: string, path: string[]) => {
    const tempDir = notNull(cacheDir)
      ? join(cacheDir, "merged", prefix)
      : undefined;

    acceptors[`${prefix}/**`] = await writeToArchive(join(...path), {
      tempDir,
    });
  };

  await write("data", [paxiFolder, "datapacks", "generated.zip"]);
  await write("assets", [paxiFolder, "resourcepacks", "generated.zip"]);
  await write("content", [to, "contentpacks", "generated.zip"]);

  // TODO write to archive check for actual files
  const fallback = simpleAcceptor(async (...args) => {
    await Promise.all(Object.values(acceptors).map((it) => it.accept(...args)));
  });

  const acceptor = distributedAcceptor(acceptors, fallback);

  await from.extract(acceptor);
}
