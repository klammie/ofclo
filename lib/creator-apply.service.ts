import { db } from "@/db";
import { creatorApplication } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { ApplicationDraft, ApplicationStatus } from "@/lib/types";

// ─── Get or create draft ──────────────────────────────────────────────────────

export async function getOrCreateApplication(userId: string) {
  const existing = await db.query.creatorApplication.findFirst({
    where: eq(creatorApplication.userId, userId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(creatorApplication)
    .values({ id: randomUUID(), userId })
    .returning();
  return created;
}

// ─── Save draft (step by step) ────────────────────────────────────────────────

export async function saveDraft(userId: string, data: Partial<any> & { currentStep?: number }) {
  const app = await getOrCreateApplication(userId);
  if (app.status === "submitted" || app.status === "under_review" || app.status === "approved") {
    throw new Error("APPLICATION_ALREADY_SUBMITTED");
  }

  await db
    .update(creatorApplication)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(creatorApplication.userId, userId));

  return { success: true };
}

// ─── Upload ID document (returns a placeholder — wire up your storage) ────────

export async function saveDocumentUrl(
  userId: string,
  field: "documentFrontUrl" | "documentBackUrl" | "selfieWithIdUrl" | "selfieUrl",
  url: string
) {
  await db
    .update(creatorApplication)
    .set({ [field]: url, updatedAt: new Date() })
    .where(eq(creatorApplication.userId, userId));
}

// ─── Submit application ───────────────────────────────────────────────────────

export async function submitApplication(userId: string) {
  const app = await getOrCreateApplication(userId);

  // Basic validation — all required fields present
  const missing: string[] = [];
  if (!app.legalFirstName)   missing.push("Legal first name");
  if (!app.legalLastName)    missing.push("Legal last name");
  if (!app.dateOfBirth)      missing.push("Date of birth");
  if (!app.country)          missing.push("Country");
  if (!app.documentType)     missing.push("ID document type");
  if (!app.documentFrontUrl) missing.push("ID document front photo");
  if (!app.selfieWithIdUrl)  missing.push("Selfie with ID");
  if (!app.displayName)      missing.push("Display name");
  if (!app.username)         missing.push("Username");
  if (!app.agreedToTerms)    missing.push("Terms of service agreement");
  if (!app.agreedToAge18)    missing.push("Age confirmation");
  if (!app.signature)        missing.push("Signature");

  if (missing.length > 0) {
    throw new Error(`MISSING_FIELDS:${missing.join("|")}`);
  }

  await db
    .update(creatorApplication)
    .set({ status: "submitted", submittedAt: new Date(), currentStep: 5, updatedAt: new Date() })
    .where(eq(creatorApplication.userId, userId));

  // TODO: Send confirmation email, notify admin, etc.

  return { success: true, message: "Your application has been submitted and is under review." };
}

// ─── Get application status ───────────────────────────────────────────────────

export async function getApplicationStatus(userId: string): Promise<{
  status: ApplicationStatus;
  currentStep: number;
  rejectionReason: string | null;
  submittedAt: string | null;
} | null> {
  const app = await db.query.creatorApplication.findFirst({
    where: eq(creatorApplication.userId, userId),
  });
  if (!app) return null;
  return {
    status: app.status as ApplicationStatus,
    currentStep: app.currentStep,
    rejectionReason: app.rejectionReason,
    submittedAt: app.submittedAt?.toISOString() ?? null,
  };
}

// ─── Admin: approve / reject ──────────────────────────────────────────────────

export async function reviewApplication(
  applicationId: string,
  reviewerId: string,
  decision: "approved" | "rejected" | "more_info_required",
  rejectionReason?: string
) {
  await db
    .update(creatorApplication)
    .set({
      status: decision,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason: rejectionReason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(creatorApplication.id, applicationId));

  // If approved, update user role to "creator" in your users table here
}