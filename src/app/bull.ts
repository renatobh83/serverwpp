import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { Application } from "express";
import { addJob, processQueues, queues } from "../libs/Queue";
import { logger } from "../utils/logger";




import Queue from "../libs/Queue2";

export default async function bullMQ(app) {
  console.info("bullMQ started");
  await Queue.process();

  // await Queue.add("VerifyScheduleMessages", {});
  await Queue.add("VerifyTicketsChatBotInactives", {});
  await Queue.add("SendMessageSchenduled", {});

	// Inicialize o painel do Bull
	const serverAdapter = new ExpressAdapter();
	serverAdapter.setBasePath("/admin/queues");

	createBullBoard({
		queues: queues.map((q) => new BullMQAdapter(q.bull)),
		serverAdapter: serverAdapter,
	});

	// Adicione ao Express
	app.use("/admin/queues", serverAdapter.getRouter());
}
