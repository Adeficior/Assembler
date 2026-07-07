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
  data: boolean;
  assets: boolean;
  content: boolean;
  cacheDir?: string;
};

const defaultOptions: MergeOptions = {
  assets: false,
  data: true,
  content: false,
};

export default async function mergeResources(
  from: Resolver,
  to: string,
  options: Partial<MergeOptions> = {},
) {
  const { cacheDir, ...include } = {
    ...defaultOptions,
    ...options,
  };

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

  if (include.data) {
    await write("data", [paxiFolder, "datapacks", "generated.zip"]);
  }
  if (include.assets) {
    await write("assets", [paxiFolder, "resourcepacks", "generated.zip"]);
  }
  if (include.content) {
    await write("content", [to, "contentpacks", "generated.zip"]);
  }

  const fallback = simpleAcceptor(async (...args) => {
    await Promise.all(Object.values(acceptors).map((it) => it.accept(...args)));
  });

  const acceptor = distributedAcceptor(acceptors, fallback);

  await from.extract(acceptor);
}
