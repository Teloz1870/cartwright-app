import { z } from "zod";

const slug = z.string().regex(/^[a-z][a-z0-9-]*$/);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const shopBriefSchema = z.object({
  storeName: z.string().min(1),
  slug,
  tagline: z.string().min(1),
  sells: z.string().min(1),
  audience: z.string().min(1),
  tone: z.string().min(1),
  country: z.string().regex(/^[A-Z]{2}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  palette: z.object({ primary: hex, background: hex }),
  categories: z.array(z.object({ name: z.string().min(1), slug })).min(1).max(8),
  products: z
    .array(
      z.object({
        name: z.string().min(1),
        categorySlug: z.string().min(1),
        priceMinor: z.number().int().positive(),
        blurb: z.string().min(1),
      }),
    )
    .min(1)
    .max(40),
});

export type ShopBrief = z.infer<typeof shopBriefSchema>;
