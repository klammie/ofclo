"use server";

import { db } from "@/db"; // Your Drizzle instance
import { profiles, creators } from "@/db/schema";
import { 
  createProfileSchema, 
  updateProfileSchema,
  type CreateProfileInput,
  type UpdateProfileInput 
} from "@/lib/validation";
import { auth } from "@/app/lib/auth"; // Your better-auth instance
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Get current session
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

// Create user profile (called after initial signup)
export async function createProfile(data: CreateProfileInput) {
  try {
    const session = await getSession();
    
    // Validate input
    const validated = createProfileSchema.parse(data);
    
    // Check if username is taken
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.username, validated.username))
      .limit(1);
    
    if (existingProfile.length > 0) {
      return { success: false, error: "Username already taken" };
    }
    
    // Create profile
    const [profile] = await db
      .insert(profiles)
      .values({
        id: session.user.id,
        ...validated,
      })
      .returning();
    
    revalidatePath("/profile");
    
    return { success: true, data: profile };
  } catch (error) {
    console.error("Create profile error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create profile" 
    };
  }
}

// Get user's own profile
export async function getMyProfile() {
  try {
    const session = await getSession();
    
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);
    
    return { success: true, data: profile || null };
  } catch (error) {
    return { success: false, error: error };
  }
}

// Get profile by username (public)
export async function getProfileByUsername(username: string) {
  try {
    const [profile] = await db
      .select({
        profile: profiles,
        creatorAccount: creators,
      })
      .from(profiles)
      .leftJoin(creators, eq(profiles.id, creators.id))
      .where(eq(profiles.username, username))
      .limit(1);
    
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }
    
    return { success: true, data: profile };
  } catch (error) {
    return { success: false, error: error };
  }
}

// Update profile
export async function updateProfile(data: UpdateProfileInput) {
  try {
    const session = await getSession();
    
    // Get user's profile
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);
    
    if (!existingProfile) {
      return { success: false, error: "Profile not found" };
    }
    
    // Validate input
    const validated = updateProfileSchema.parse(data);
    
    // If username is being changed, check if it's available
    if (validated.username && validated.username !== existingProfile.username) {
      const [usernameCheck] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.username, validated.username))
        .limit(1);
      
      if (usernameCheck) {
        return { success: false, error: "Username already taken" };
      }
    }
    
    // Update profile
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existingProfile.id))
      .returning();
    
    revalidatePath("/profile");
    revalidatePath(`/${existingProfile.username}`);
    
    return { success: true, data: updatedProfile };
  } catch (error) {
    console.error("Update profile error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update profile" 
    };
  }
}

// Delete profile
export async function deleteProfile() {
  try {
    const session = await getSession();
    
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);
    
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }
    
    await db
      .delete(profiles)
      .where(eq(profiles.id, profile.id));
    
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error };
  }
}