import type { ChatMessage } from "../entities/ChatMessage";
import type { IChatRepository } from "../chat.repository";

export interface IChatService {
    saveMessage(data: Partial<ChatMessage>): Promise<ChatMessage>;
    getHistory(userId: string): Promise<ChatMessage[]>;
    getAdminMessages(relations?: string[]): Promise<ChatMessage[]>;
}

export class ChatService implements IChatService {
    constructor(private readonly chatRepository: IChatRepository) { }

    async saveMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
        const message = await this.chatRepository.saveMessage(data);
        return message;
    }

    async getHistory(userId: string): Promise<ChatMessage[]> {
        return await this.chatRepository.getHistory(userId);
    }

    async getAdminMessages(relations?: string[]): Promise<ChatMessage[]> {
        return await this.chatRepository.getAdminMessages(relations);
    }
}