export default {
    key: "SendMessageAPI",
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
    async handle({ data }: any) { }
}