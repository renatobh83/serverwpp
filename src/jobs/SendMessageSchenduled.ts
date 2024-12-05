import { logger } from "../utils/logger";


export default {
	key: "SendMessageSchenduled",
	options: {
		removeOnComplete: false,
		removeOnFail: false,
		jobId: "SendMessageSchenduled",
		repeat: {
			every: 1 * 60 * 1000,
		},
	},
	async handle() {
		try {
			logger.info("SendMessageSchenduled Initiated");
				console.log("Job executando")
			logger.info("Finalized SendMessageSchenduled");
		} catch (error) {
			logger.error({ message: "Error send messages", error });
		}
	},
};
