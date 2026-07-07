import { notNull, type Logger } from "@adeficior/pack-resolver";
import { TOML } from "bun";
import { join } from "node:path";

export type Pack = {
  name: string;
  author?: string;
  version?: string;
  index: {
    file: string;
    "hash-format": string;
    hash: string;
  };
  versions: {
    minecraft: string;
    neoforge?: string;
    fabric?: string;
    forge?: string;
  };
  options?: {
    "release-type"?: string;
  };
};

const { RELEASE_VERSION } = process.env;
const validReleaseTypes = ["alpha", "beta", "release"];

export async function loadPack(dir: string, logger: Logger) {
  const packFile = Bun.file(join(dir, "pack.toml"));

  const raw = await packFile.text();
  const parsed = TOML.parse(raw) as Pack;

  const releaseType = parsed.options?.["release-type"];
  if (notNull(releaseType) && !validReleaseTypes.includes(releaseType)) {
    throw new Error(`invalid release type '${releaseType}'`);
  }

  if (RELEASE_VERSION) {
    parsed.version = RELEASE_VERSION;
    const modified = raw.replace(
      /(version\s*=\s*").+(")/,
      `$1${RELEASE_VERSION}$2`,
    );

    logger.info(`updating pack.toml version to ${RELEASE_VERSION}`);

    await packFile.write(modified);
  }

  return parsed;
}
