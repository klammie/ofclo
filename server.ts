// server.ts
// Custom Next.js server with Socket.IO support
// TypeScript version with proper ESM imports

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Import database and schema dynamically to avoid initialization issues
let db: any;
let messages: any;
let conversations: any;
let user: any;
let eq: any;
let and: any;

async function initializeDatabase() {
  try {
    const dbModule = await import('./db/index.js');
    const schemaModule = await import('./db/schema.js');
    const drizzleModule = await import('drizzle-orm');

    db = dbModule.db;
    messages = schemaModule.messages;
    conversations = schemaModule.conversations;
    user = schemaModule.user;
    eq = drizzleModule.eq;
    and = drizzleModule.and;

    console.log('[Database] Connected successfully');
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
}

app.prepare().then(async () => {
  // Initialize database first
  await initializeDatabase();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('[Socket.IO] Server initializing...');

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Authenticate user
    socket.on('authenticate', (userId: string) => {
      console.log(`[Socket.IO] User ${userId} authenticated`);
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      socket.emit('authenticated', { userId });
    });

    // Send message
    socket.on('send_message', async (data: {
      fromUserId: string;
      toUserId: string;
      content: string;
    }) => {
      try {
        const { fromUserId, toUserId, content } = data;
        console.log(`[Socket.IO] Message from ${fromUserId} to ${toUserId}`);

        // Validate content
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Verify sender is authenticated user
        if (fromUserId !== socket.data.userId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Save message to database
        const [newMessage] = await db
          .insert(messages)
          .values({
            fromUserId,
            toUserId,
            content: content.trim().slice(0, 5000), // Max 5000 chars
          })
          .returning();

        // Update conversation
        await updateConversation(fromUserId, toUserId, newMessage);

        // Prepare message object
        const messageData = {
          id: newMessage.id,
          fromUserId: newMessage.fromUserId,
          toUserId: newMessage.toUserId,
          content: newMessage.content,
          createdAt: newMessage.createdAt.toISOString(),
          isRead: false,
        };

        // Emit to recipient
        io.to(`user:${toUserId}`).emit('receive_message', messageData);

        // Confirm to sender
        socket.emit('message_sent', messageData);

      } catch (error) {
        console.error('[Socket.IO] Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data: {
      userId: string;
      otherUserId: string;
    }) => {
      try {
        const { userId, otherUserId } = data;

        await db
          .update(messages)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(messages.fromUserId, otherUserId),
              eq(messages.toUserId, userId),
              eq(messages.isRead, false)
            )
          );

        await resetUnreadCount(userId, otherUserId);

        io.to(`user:${otherUserId}`).emit('messages_read', { userId });

      } catch (error) {
        console.error('[Socket.IO] Error marking read:', error);
      }
    });

    // Typing indicators
    socket.on('typing_start', (data: { fromUserId: string; toUserId: string }) => {
      io.to(`user:${data.toUserId}`).emit('user_typing', {
        userId: data.fromUserId,
      });
    });

    socket.on('typing_stop', (data: { fromUserId: string; toUserId: string }) => {
      io.to(`user:${data.toUserId}`).emit('user_stopped_typing', {
        userId: data.fromUserId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Helper functions
  async function updateConversation(userId1: string, userId2: string, message: any) {
    const [participant1, participant2] = [userId1, userId2].sort();

    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, participant1),
          eq(conversations.participant2Id, participant2)
        )
      )
      .limit(1);

    if (existing) {
      const isUser1Sender = userId1 === participant1;
      await db
        .update(conversations)
        .set({
          lastMessageId: message.id,
          lastMessageContent: message.content,
          lastMessageAt: message.createdAt,
          unreadCountUser1: isUser1Sender
            ? existing.unreadCountUser1
            : existing.unreadCountUser1 + 1,
          unreadCountUser2: isUser1Sender
            ? existing.unreadCountUser2 + 1
            : existing.unreadCountUser2,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, existing.id));
    } else {
      const isUser1Sender = userId1 === participant1;
      await db.insert(conversations).values({
        participant1Id: participant1,
        participant2Id: participant2,
        lastMessageId: message.id,
        lastMessageContent: message.content,
        lastMessageAt: message.createdAt,
        unreadCountUser1: isUser1Sender ? 0 : 1,
        unreadCountUser2: isUser1Sender ? 1 : 0,
      });
    }
  }

  async function resetUnreadCount(userId: string, otherUserId: string) {
    const [participant1, participant2] = [userId, otherUserId].sort();
    const isUser1 = userId === participant1;

    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, participant1),
          eq(conversations.participant2Id, participant2)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(conversations)
        .set({
          unreadCountUser1: isUser1 ? 0 : existing.unreadCountUser1,
          unreadCountUser2: isUser1 ? existing.unreadCountUser2 : 0,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, existing.id));
    }
  }

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('[Socket.IO] Server ready for connections');
  });
});