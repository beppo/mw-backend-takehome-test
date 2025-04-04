import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RequestLogEntry {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'datetime' })
    requestDateTime: Date;

    @Column('decimal', { precision: 10, scale: 2 })
    requestDuration: number;

    @Column()
    requestUrl: string;

    @Column()
    responseCode: number;

    @Column({ nullable: true })
    errorMessage?: string;

    @Column({ length: 50 })
    providerName: string;
}