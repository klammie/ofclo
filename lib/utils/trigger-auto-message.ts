// lib/utils/trigger-auto-message.ts
import { db } from "@/db";
import { autoMessages, autoMessageQueue, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function triggerAutoMessage(
  creatorId: string,
  userId: string,
  triggerType: string,
  tier?: string
) {
  try {
    // Find matching auto messages
    const matchingMessages = await db
      .select()
      .from(autoMessages)
      .where(
        and(
          eq(autoMessages.creatorId, creatorId),
          eq(autoMessages.triggerType, triggerType),
          eq(autoMessages.isActive, true)
        )
      );

    for (const autoMsg of matchingMessages) {
      // Check tier match (if specified)
      if (autoMsg.tier && tier && autoMsg.tier !== tier) {
        continue;
      }

      // Calculate send time
      const scheduledFor = new Date();
      scheduledFor.setMinutes(scheduledFor.getMinutes() + autoMsg.delayMinutes);

      if (autoMsg.delayMinutes === 0) {
        // Send immediately
        await sendAutoMessage(autoMsg.id, userId);
      } else {
        // Queue for later
        await db.insert(autoMessageQueue).values({
          autoMessageId: autoMsg.id,
          userId,
          scheduledFor,
          status: "pending",
        });
      }

      // Increment sent count
      await db
        .update(autoMessages)
        .set({
          sentCount: autoMsg.sentCount + 1,
        })
        .where(eq(autoMessages.id, autoMsg.id));
    }
  } catch (error) {
    console.error("[Trigger Auto Message] Error:", error);
  }
}

async function sendAutoMessage(autoMessageId: string, userId: string) {
  try {
    // Get auto message
    const [autoMsg] = await db
      .select()
      .from(autoMessages)
      .where(eq(autoMessages.id, autoMessageId))
      .limit(1);

    if (!autoMsg) return;

    // Get user info for personalization
    const [userInfo] = await db.execute(sql`
      SELECT name FROM "user" WHERE id = ${userId}
    `);

    // Personalize message
    let personalizedText = autoMsg.messageText;
    if (userInfo) {
      personalizedText = personalizedText.replace(/{name}/g, userInfo.rows[0]?.name || "there");
    }

    // Send message
    await db.insert(messages).values({
      fromUserId: (await db.execute(sql`
        SELECT user_id FROM ${creators} WHERE id = ${autoMsg.creatorId}
      `)).rows[0]?.user_id,
      toUserId: userId,
      content: personalizedText,
      mediaType: autoMsg.mediaType,
      mediaUrl: autoMsg.mediaUrl,
      thumbnailUrl: autoMsg.mediaUrl,
      isPpv: false,
      isRead: false,
    });

    console.log(`[Auto Message] Sent: ${autoMessageId} to ${userId}`);
  } catch (error) {
    console.error("[Send Auto Message] Error:", error);
  }
}