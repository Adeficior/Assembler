import type { Logger } from "@adeficior/pack-resolver";

export function logError(
  logger: Logger,
  error: unknown,
  prefix = "an error occured",
) {
  if (error instanceof Error) {
    logger.error(`${prefix}:`);

    if (error.stack) logger.error(error.stack);
    else logger.error(error.message);
  } else {
    logger.error("an unknown error occured");
  }
}
