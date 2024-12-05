import type { Application } from "express";
import "../app/config-env";
import bullMq from "./bull";
import waitForPostgresConnection from "./awaitPostgresConnection";
import express from "./express";
import config from "../config/config";
import modules from "./module";
import database from "./database";


export default async function bootstrap(app: Application): Promise<void> {
	await waitForPostgresConnection();
	await express(app, config);
	await database(app);
	await modules(app);
	await bullMq(app); // precisar subir na instancia dos bots
}
