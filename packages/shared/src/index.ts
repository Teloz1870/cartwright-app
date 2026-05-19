import { z } from "zod";

/**
 * Cartwright CLI prompt schema. Used by both `create-cartwright` (CLI) and the
 * docs site (to render prompt-walkthroughs from the same source-of-truth).
 *
 * Add new prompts here — they auto-appear in both surfaces.
 */
export const promptAnswersSchema = z.object({
  projectName: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, "lowercase + dashes only, start with a letter"),
  database: z.enum(["turso", "postgres", "sqlite"]).default("turso"),
  withAi: z.boolean().default(true),
  packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]).default("pnpm"),
  installDeps: z.boolean().default(true),
  initGit: z.boolean().default(true),
});

export type PromptAnswers = z.infer<typeof promptAnswersSchema>;

/**
 * Cartwright brand-config schema (subset relevant to scaffold + docs).
 *
 * The full schema lives in the cartwright template's `brand.config.ts`; this
 * shared subset is what the CLI fills in at scaffold-time and what the docs
 * site renders in its "Configuration reference" table.
 */
export const brandConfigSubsetSchema = z.object({
  storeName: z.string(),
  storeSlug: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/),
  domain: z.string(),
  currency: z.enum(["DKK", "EUR", "USD", "GBP", "SEK", "NOK"]).default("DKK"),
  industryTemplate: z.string().default("generic"),
  features: z.object({
    aiStylist: z.boolean(),
    newsletter: z.boolean(),
    mcpPublic: z.boolean(),
    tryOn: z.boolean(),
  }),
});

export type BrandConfigSubset = z.infer<typeof brandConfigSubsetSchema>;
