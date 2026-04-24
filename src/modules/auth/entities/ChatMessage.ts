import {  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Ticket } from "./Ticket";

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    @Column()
    sender_id: string;

    @Column()
    receiver_id: string;

    @Column()
    isAdminMessage: boolean;

    @Column({ nullable: true })
    ticket_id: string;

    @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: Ticket;

    @CreateDateColumn()
    createdAt: Date;
}