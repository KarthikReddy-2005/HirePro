import z from "zod";

export const createOrganizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Organization name must contain at least 2 characters")
      .max(100, "Organization name cannot exceed 100 characters"),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "Slug must contain at least 2 characters")
      .max(60, "Slug cannot exceed 60 characters")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ),

    description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),

    website: z.string().trim().url("Website must be a valid URL").optional(),

    logoUrl: z.string().trim().url("Logo URL must be a valid URL").optional(),
  })
  .strict();
