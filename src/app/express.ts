import { Application, json, NextFunction, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "../utils/logger";

import type { ServerOptions } from "../@types/ServerOptions";
import { defaultLogger } from "@wppconnect-team/wppconnect";


export default async function express(
	app: Application,serverOptions: Partial<ServerOptions>,
) {
	const normalizedServerOptions =
		typeof serverOptions === "object" && serverOptions !== null
			? serverOptions
			: {};
	// LOG DO WPCONNECT
	defaultLogger.level = normalizedServerOptions?.log?.level
		? normalizedServerOptions.log.level
		: "silly";
	app.use(
		cors({
			origin: ["http://localhost:5173", "https://app3.pluslive.online"],
			credentials: true,
		}),
	);
	app.use(cookieParser());
	app.use(json({ limit: "50MB" }));
	app.use(helmet());
	app.use(
		urlencoded({ extended: true, limit: "50MB", parameterLimit: 200000 }),
	);
	app.use((req: any, res: any, next: NextFunction) => {
		req.serverOptions = normalizedServerOptions;
		next();
	});
	logger.info("express already in server!");
}