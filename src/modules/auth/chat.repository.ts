import { Repository } from 'typeorm';
import { AppDataSource } from '../../shared/config/database';
import { ChatMessage } from './entities/ChatMessage';

export interface IChatRepository {
    saveMessage(data: Partial<ChatMessage>): Promise<ChatMessage>;
    getHistory(userId: string): Promise<ChatMessage[]>;
    getAdminMessages(relations?: string[]): Promise<ChatMessage[]>;
    create(data: Partial<ChatMessage>): Promise<ChatMessage>;
    getByTicketId(ticketId: string): Promise<ChatMessage[]>;
}

export class ChatRepository implements IChatRepository {
    private repository: Repository<ChatMessage>;

    constructor() {
        this.repository = AppDataSource.getRepository(ChatMessage);
    }

    async saveMessage(data: Partial<ChatMessage>): Promise<ChatMessage> {
        const message = this.repository.create(data);
        return await this.repository.save(message);
    }

    async getHistory(userId: string): Promise<ChatMessage[]> {
        // Buscamos mensajes donde el usuario sea emisor O receptor
        return await this.repository.find({
            where: [
                { sender_id: userId },
                { receiver_id: userId }
            ],
            order: { createdAt: 'ASC' }
        });
    }

    async getAdminMessages(relations?: string[]): Promise<ChatMessage[]> {
        return await this.repository.find({ where: { isAdminMessage: true }, relations });
    }

    async create(data: Partial<ChatMessage>): Promise<ChatMessage> {
        const message = this.repository.create(data);
        return await this.repository.save(message);
    }

    async getByTicketId(ticketId: string): Promise<ChatMessage[]> {
        return await this.repository.find({
            where: { ticket_id: ticketId },
            order: { createdAt: 'ASC' }
        });
    }
}
