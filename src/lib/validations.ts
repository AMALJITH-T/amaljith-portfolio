import { z } from "zod";
import sanitizeHtml from "sanitize-html";

// HTML Sanitization options - extremely strict for text-only fields
const sanitizeText = (val: string) => sanitizeHtml(val, {
    allowedTags: [], // No tags allowed
    allowedAttributes: {},
});

// HTML Sanitization for content that might need basic formatting (e.g. bold, italic)
const sanitizeContent = (val: string) => sanitizeHtml(val, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
        'a': ['href']
    },
});

export const ContactSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name too long").transform(sanitizeText),
    email: z.string().email("Invalid email address").max(150, "Email too long").transform(sanitizeText),
    message: z.string().min(1, "Message is required").max(2000, "Message too long").transform(sanitizeText),
});

export const ThreadSchema = z.object({
    title: z.string().min(1, "Title is required").max(150, "Title too long").transform(sanitizeText),
    content: z.string().min(1, "Content is required").max(5000, "Content too long").transform(sanitizeContent),
    author: z.string().max(50, "Author name too long").optional().transform(v => v ? sanitizeText(v) : "Anonymous"),
});

export const ReplySchema = z.object({
    content: z.string().min(1, "Content is required").max(3000, "Content too long").transform(sanitizeContent),
    author: z.string().max(50, "Author name too long").optional().transform(v => v ? sanitizeText(v) : "Anonymous"),
});

export const SuggestionSchema = z.object({
    type: z.enum(["tone", "grammar", "expand", "summarize"]),
    content: z.string().min(1, "Content required").max(5000, "Content too long").transform(sanitizeText),
});

export const ChatMessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().max(2000, "Message too long").transform(sanitizeText),
});

export const ChatRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).max(20, "Too many messages in history"),
});
