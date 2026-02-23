"use server";

import { db } from "@/db/index";
import { profiles, creators } from "@/db/schema";
import { 
  applyForCreatorSchema,
  updateCreatorAccountSchema,
  reviewCreatorApplicationSchema,
  type ApplyForCreatorInput,
  type UpdateCreatorAccountInput,
  type ReviewCreatorApplicationInput
} from "@/lib/validation";
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { eq, InferInsertModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type CreatorAccountInsert = InferInsertModel<typeof creators>;

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

// Apply to become a creator
export async function applyForCreator(data: ApplyForCreatorInput) {
  try {
    const session = await getSession();

    // Get user's profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.user.id)) // use profiles.id
      .limit(1);

    if (!profile) {
      return { success: false, error: "Profile not found. Please create a profile first." };
    }

    // Check if already has creator account
    const [existingCreator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, session.user.id))
      .limit(1);

    if (existingCreator) {
      return { success: false, error: "You already have a creator account" };
    }

    // Validate input
    const validated = applyForCreatorSchema.parse(data);

    // Create creator account application
    const [creator] = await db
      .insert(creators)
      .values({
        userId: session.user.id,
        bio: validated.applicationReason, // map to bio
        standardPrice: validated.subscriptionPrice, // schema uses decimal
        status: "pending",
        isVerified: false,
      })
      .returning();

    revalidatePath("/creator/apply");
    revalidatePath("/profile");

    return { success: true, data: creator };
  } catch (error) {
    console.error("Apply for creator error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit application"
    };
  }
}

// Get creator account status
export async function getMyCreatorAccount() {
  try {
    const session = await getSession();

    const [result] = await db
      .select({
        profile: profiles,
        creator: creators,
      })
      .from(profiles)
      .leftJoin(creators, eq(profiles.id, creators.userId)) // join on userId
      .where(eq(profiles.id, session.user.id))
      .limit(1);

    if (!result) {
      return { success: false, error: "Profile not found" };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Update creator account settings
export async function updateCreatorAccount(data: UpdateCreatorAccountInput) {
  try {
    const session = await getSession();

    const [result] = await db
      .select({
        profile: profiles,
        creator: creators,
      })
      .from(profiles)
      .innerJoin(creators, eq(profiles.id, creators.userId))
      .where(eq(profiles.id, session.user.id))
      .limit(1);

    if (!result?.creator) {
      return { success: false, error: "Creator account not found" };
    }

    if (result.creator.status !== "active") {
      return { success: false, error: "Only active creators can update settings" };
    }

    const validated = updateCreatorAccountSchema.parse(data);

    const updateData: Partial<typeof creators.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (validated.subscriptionPrice !== undefined) {
      updateData.standardPrice = validated.subscriptionPrice;
    }

    if (validated.bio !== undefined) {
      updateData.bio = validated.bio;
    }

    const [updated] = await db
      .update(creators)
      .set(updateData)
      .where(eq(creators.id, result.creator.id))
      .returning();

    revalidatePath("/creator/settings");
    revalidatePath(`/${result.profile.username}`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Update creator account error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update creator account"
    };
  }
}
// Admin: Review creator application
export async function reviewCreatorApplication(
  creatorId: string, 
  data: ReviewCreatorApplicationInput
) {
  try {
    const validated = reviewCreatorApplicationSchema.parse(data);

    const [creator] = await db
      .update(creators)
      .set({
        status: validated.status, // must match creatorStatusEnum
        isVerified: validated.status === "active", // schema uses isVerified
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId))
      .returning();

    if (!creator) {
      return { success: false, error: "Creator account not found" };
    }

    revalidatePath("/admin/creators");

    return { success: true, data: creator };
  } catch (error) {
    console.error("Review creator application error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to review application" 
    };
  }
}

// Get all pending creator applications (admin only)
export async function getPendingCreatorApplications() {
  try {
    const applications = await db
      .select({
        creator: creators,
        profile: profiles,
      })
      .from(creators)
      .innerJoin(profiles, eq(creators.userId, profiles.id))
      .where(eq(creators.status, "pending"))
      .orderBy(creators.createdAt);

    return { success: true, data: applications };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}