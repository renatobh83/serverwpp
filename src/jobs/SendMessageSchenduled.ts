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
			fetch('https://play.svix.com/in/e_c5d4GSKsjhadlv5FOvA79vvUNNw/', {
					method: 'POST',
					headers: {
					  'Content-Type': 'application/json',
					},
					body: JSON.stringify({
					  username: 'xyz',
					  password: 'xyz',
					}),
				  })
				  
			logger.info("Finalized SendMessageSchenduled");
		} catch (error) {
			logger.error({ message: "Error send messages", error });
		}
	},
};
