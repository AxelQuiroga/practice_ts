import type { ChatMessage } from "../entities/ChatMessage";
import { Ticket, TicketStatus } from "../entities/Ticket";
import type { IChatRepository } from "../chat.repository";
import type { ITicketRepository } from "../ticket.repository";

export interface IChatService {
    saveMessage(data: Partial<ChatMessage>): Promise<ChatMessage>;
    getHistory(userId: string): Promise<ChatMessage[]>;
    getAdminMessages(relations?: string[]): Promise<ChatMessage[]>;
    
    // Ticket methods
    createTicket(userId: string, subject: string): Promise<Ticket>;
    getTicketsForUser(userId: string): Promise<Ticket[]>;
    getAllActiveTickets(): Promise<Ticket[]>;
    resolveTicket(ticketId: string): Promise<void>;
    updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void>;
    getTicketMessages(ticketId: string): Promise<ChatMessage[]>;
}

export class ChatService implements IChatService {
    constructor(
        private readonly chatRepository: IChatRepository,
        private readonly ticketRepository: ITicketRepository
    ) { }

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

    async createTicket(userId: string, subject: string): Promise<Ticket> {
        const activeCount = await this.ticketRepository.countActiveByUserId(userId);
        if (activeCount >= 5) {
            throw new Error("Límite de tickets alcanzado (máximo 5). Por favor, resolvé tus tickets actuales antes de abrir uno nuevo.");
        }

        return await this.ticketRepository.create({
            user_id: userId,
            subject,
            status: TicketStatus.OPEN
        });
    }

    async getTicketsForUser(userId: string): Promise<Ticket[]> {
        return await this.ticketRepository.findByUserAndStatus(userId, [
            TicketStatus.OPEN,
            TicketStatus.IN_PROGRESS,
            TicketStatus.RESOLVED
        ]);
    }

    async getAllActiveTickets(): Promise<Ticket[]> {
        return await this.ticketRepository.getAllActive();
    }

    async resolveTicket(ticketId: string): Promise<void> {
        await this.ticketRepository.updateStatus(ticketId, TicketStatus.RESOLVED);
    }

    async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
        await this.ticketRepository.updateStatus(ticketId, status);
    }

    async getTicketMessages(ticketId: string): Promise<ChatMessage[]> {
        return await this.chatRepository.getByTicketId(ticketId);
    }
}