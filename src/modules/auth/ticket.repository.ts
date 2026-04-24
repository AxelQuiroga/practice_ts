import { Repository } from 'typeorm';
import { AppDataSource } from '../../shared/config/database';
import { Ticket, TicketStatus } from './entities/Ticket';

export interface ITicketRepository {
    create(data: Partial<Ticket>): Promise<Ticket>;
    findById(id: string): Promise<Ticket | null>;
    findByUserAndStatus(userId: string, statuses: TicketStatus[]): Promise<Ticket[]>;
    countActiveByUserId(userId: string): Promise<number>;
    updateStatus(id: string, status: TicketStatus): Promise<void>;
    getAllActive(): Promise<Ticket[]>;
}

export class TicketRepository implements ITicketRepository {
    private repository: Repository<Ticket>;

    constructor() {
        this.repository = AppDataSource.getRepository(Ticket);
    }

    async create(data: Partial<Ticket>): Promise<Ticket> {
        const ticket = this.repository.create(data);
        return await this.repository.save(ticket);
    }

    async findById(id: string): Promise<Ticket | null> {
        return await this.repository.findOne({ 
            where: { id },
            relations: ['user', 'messages']
        });
    }

    async findByUserAndStatus(userId: string, statuses: TicketStatus[]): Promise<Ticket[]> {
        return await this.repository.find({
            where: statuses.map(status => ({ user_id: userId, status })),
            order: { createdAt: 'DESC' }
        });
    }

    async countActiveByUserId(userId: string): Promise<number> {
        return await this.repository.count({
            where: [
                { user_id: userId, status: TicketStatus.OPEN },
                { user_id: userId, status: TicketStatus.IN_PROGRESS }
            ]
        });
    }

    async updateStatus(id: string, status: TicketStatus): Promise<void> {
        await this.repository.update(id, { status });
    }

    async getAllActive(): Promise<Ticket[]> {
        return await this.repository.find({
            where: [
                { status: TicketStatus.OPEN },
                { status: TicketStatus.IN_PROGRESS }
            ],
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }
}
