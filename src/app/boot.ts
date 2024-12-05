import type { Application } from "express";
import "../app/config-env";
import bullMq from "./bull";


export default async function bootstrap(app: Application): Promise<void> {
	// await waitForPostgresConnection();
	// await express(app, config);
	// await database(app);
	// await modules(app);
	await bullMq(app); // precisar subir na instancia dos bots
}
