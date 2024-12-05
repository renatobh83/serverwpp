import express, { Application, type Express } from "express";
import { logger } from "../utils/logger";
import bootstrap from "./boot";
import { closeQueues, closeWorkers } from "../libs/Queue";
import { type Server, createServer } from "node:http";
import { initIO } from "../libs/scoket";



export default async function application(): Promise<Application> {
    const app: Express | any = express();
	const httpServer: Server = createServer(app);
	const port = 3100;

	await bootstrap(app)
    async function start() {
		const host = app.get("host") || "0.0.0.0";
		app.server = httpServer.listen(port, host, async () => {
			logger.info(`Web server listening at: http://${host}:${port}/`);


		});
		app.use(express.json());
		initIO(app.server);

	}

	async function close() {
		try {
			logger.info("Iniciando encerramento da aplicação...");

			// Fechar o servidor HTTP
			await new Promise<void>((resolve, reject) => {
				httpServer.close((err: any) => {
					if (err) {
						logger.error("Erro ao encerrar o servidor HTTP:", err);
						return reject(err);
					}
					logger.info("Servidor HTTP encerrado com sucesso.");
					resolve();
				});
			});

			// Fechar os workers e filas
			await closeWorkers();
			logger.info("Workers encerrados com sucesso.");
			await closeQueues();
			logger.info("Filas encerradas com sucesso.");

			logger.info("Encerramento da aplicação concluído com sucesso.");
			process.exit(0); // Encerrar o processo após o fechamento completo
		} catch (error) {
			logger.error("Erro durante o encerramento da aplicação:", error);
			process.exit(1); // Sinalizar falha no encerramento
		}
	}
	process.on("SIGTERM", close); // Para encerramento via SIGTERM (ex.: Docker, Kubernetes)
	process.on("SIGINT", close);

	app.start = start;
	app.close = close;

	return app
}