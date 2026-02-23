import { z } from "zod";

// Profile validation schemas
export const createProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .toLowerCase(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  avatarUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

// Creator application schema
export const applyForCreatorSchema = z.object({
  applicationReason: z.string()
    .min(50, "Please provide at least 50 characters explaining why you want to be a creator")
    .max(1000),
  subscriptionPrice: z.number()
    .min(299, "Minimum subscription price is $2.99")
    .max(9999, "Maximum subscription price is $99.99"),
  allowMessages: z.boolean().default(true),
});

// Creator account update schema
export const updateCreatorAccountSchema = z.object({
  subscriptionPrice: z.number()
    .min(299, "Minimum subscription price is $2.99")
    .max(9999, "Maximum subscription price is $99.99")
    .optional(),
  allowMessages: z.boolean().optional(),
  bio: z.string().max(500).optional(),
});

// Admin review schema
export const reviewCreatorApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  verificationNotes: z.string().max(500).optional(),
});

// Type exports
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ApplyForCreatorInput = z.infer<typeof applyForCreatorSchema>;
export type UpdateCreatorAccountInput = z.infer<typeof updateCreatorAccountSchema>;
export type ReviewCreatorApplicationInput = z.infer<typeof reviewCreatorApplicationSchema>;