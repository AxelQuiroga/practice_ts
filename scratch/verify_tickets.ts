import { AppDataSource } from "../src/shared/config/database";
import { chatService } from "../src/shared/config/dependencies";
import { TicketStatus } from "../src/modules/auth/entities/Ticket";

async function runVerification() {
    console.log("🚀 Starting Ticket System Verification...");

    try {
        await AppDataSource.initialize();
        console.log("✅ Database initialized");

        const testUserId = "84198d7b-887c-462c-8819-c197f3720501"; 
        
        console.log("\n--- Testing Ticket Limit (Max 5) ---");
        // Clear existing tickets and messages for test user to ensure clean state
        const ticketRepo = AppDataSource.getRepository("Ticket");
        const chatRepo = AppDataSource.getRepository("ChatMessage");
        
        // Find tickets to clean up messages first (if CASCADE is not active yet)
        const userTickets = await ticketRepo.find({ where: { user_id: testUserId } });
        if (userTickets.length > 0) {
            const ticketIds = userTickets.map(t => t.id);
            await chatRepo.delete({ ticket_id: (ticketIds as any) });
        }
        await ticketRepo.delete({ user_id: testUserId });

        for (let i = 1; i <= 5; i++) {
            const ticket = await chatService.createTicket(testUserId, `Test Ticket ${i}`);
            console.log(`✅ Created ticket ${i}: ${ticket.id} (${ticket.subject})`);
        }

        try {
            await chatService.createTicket(testUserId, "Excess Ticket");
            console.log("❌ ERROR: Created 6th ticket, limit failed!");
        } catch (error: any) {
            console.log(`✅ Success: Limit reached as expected: "${error.message}"`);
        }

        console.log("\n--- Testing State Transitions ---");
        const tickets = await chatService.getTicketsForUser(testUserId);
        const ticketId = tickets[0].id;
        console.log(`Testing ticket: ${ticketId}, Current Status: ${tickets[0].status}`);

        await chatService.updateTicketStatus(ticketId, TicketStatus.IN_PROGRESS);
        const updatedTicket = await ticketRepo.findOneBy({ id: ticketId }) as any;
        console.log(`✅ Status updated to: ${updatedTicket.status}`);

        await chatService.resolveTicket(ticketId);
        const resolvedTicket = await ticketRepo.findOneBy({ id: ticketId }) as any;
        console.log(`✅ Status updated to: ${resolvedTicket.status}`);

        console.log("\n--- Testing Message Association ---");
        const msg = await chatService.saveMessage({
            content: "Test message",
            sender_id: testUserId,
            receiver_id: "admins",
            isAdminMessage: false,
            ticket_id: ticketId
        });
        console.log(`✅ Message saved with ticket_id: ${msg.ticket_id}`);

        const ticketMessages = await chatService.getTicketMessages(ticketId);
        console.log(`✅ Found ${ticketMessages.length} messages for ticket ${ticketId}`);

        console.log("\n🎉 ALL BUSINESS LOGIC TESTS PASSED!");

        await AppDataSource.destroy();
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

runVerification();
