// TODO: Remover - Study Aid Module
import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const studyAidChatSchema = z.object({
  messages: z.array(chatMessageSchema),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type StudyAidChatBody = z.infer<typeof studyAidChatSchema>;
