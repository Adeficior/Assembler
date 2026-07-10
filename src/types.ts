import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "prettier";
import type { Options } from "./args";

export async function generateGlobalTypes({ dirs, logger }: Options) {
  await writeFile(
    join(dirs.types, "global.d.ts"),
    await format(
      /* javascript */ `
      declare var logger: import("@adeficior/assembler/global").ModuleGlobalContext["logger"];
      declare var loader: import("@adeficior/assembler/global").ModuleGlobalContext["loader"];
      declare var moduleName: import("@adeficior/assembler/global").ModuleGlobalContext["moduleName"];
   `,
      { parser: "typescript" },
    ),
  );

  logger.info("generated module context types");
}
