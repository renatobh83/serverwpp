import { logger } from "../utils/logger";

export default {
    key: "VerifyTicketsChatBotInactives",
	options: {
		delay: 6000,
		attempts: 50,
		removeOnComplete: true,
		removeOnFail: false,
		backoff: {
			type: "fixed",
			delay: 60000 * 3, // 3 min
		},
	},
    async handle({ data }: any) {		try {
		logger.info("VerifyTicketsChatBotInactives Initiated");
			console.log("Job executando")
		logger.info("Finalized VerifyTicketsChatBotInactives");
	} catch (error) {
		logger.error({ message: "Error send messages", error });
	} }
}