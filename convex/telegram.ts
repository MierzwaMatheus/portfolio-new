import { internalAction } from './_generated/server';
import { v } from 'convex/values';

export const notifyAdmin = internalAction({
  args: { message: v.string() },
  handler: async (_ctx, { message }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) return;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[telegram] sendMessage failed:', res.status, err);
    }
  },
});
