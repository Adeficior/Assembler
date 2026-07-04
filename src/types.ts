import type { Logger } from "@adeficior/pack-resolver";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "prettier";

export async function generateGlobalTypes(typesDir: string, logger: Logger) {
  await writeFile(
    join(typesDir, "global.d.ts"),
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
