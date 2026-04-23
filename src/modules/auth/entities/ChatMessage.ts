import {  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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

    @CreateDateColumn()
    createdAt: Date;
}