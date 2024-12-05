import fs from "node:fs";
import { promises } from "node:fs";
import path from "node:path";
import { type Whatsapp, create } from "@wppconnect-team/wppconnect";

import config from "../config/config";
import { logger } from "../utils/logger";
import { getIO } from "./scoket";
// import { wbotMessageListener } from "../services/WbotServices/wbotMessageListener";
// import type { WhatsAppServer } from "../types/WhatsAppServer";


interface Session extends Whatsapp {
	id: number;
}

const sessions: Session[] = [];
let sessionName: string;
let tenantId: string;
let whatsappSession: any;

export const initWbot = async (whatsapp: any): Promise<Session> => {
	let wbot: Session;
	tenantId = whatsapp.tenantId;
	whatsappSession = whatsapp;
	sessionName = whatsapp.name;
	const qrCodePath = path.join(
		__dirname,
		"..",
		"..",
		"public",
		`qrCode-${whatsapp.id}.png`,
	);
	const io = getIO();
	if (config.customUserDataDir) {
		config.createOptions.puppeteerOptions = {
			userDataDir: config.customUserDataDir + whatsapp.name,
		};
	}
	try {
		// Criar uma nova sessão
		wbot = (await create(
			Object.assign({},
				{ headless: true },
				config.createOptions, {
				disableWelcome: true,
				disableGoogleAnalytics: true,
				session: whatsapp.id,
				phoneNumber: whatsapp.pairingCodeEnabled ? whatsapp.wppUser : null,
				_catchLinkCode: async (code: string) => {
					await whatsapp.update({
						pairingCode: code,
						status: "qrcode",
						retries: 0,
					});
				},
				get catchLinkCode() {
					return this._catchLinkCode;
				},
				set catchLinkCode(value) {
					this._catchLinkCode = value;
				},
				catchQR: async (
					base64Qr: any,
					_asciiQr: any,
					attempt: number,
					urlCode?: string,
				) => {
					const matches = base64Qr.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
					if (!matches || matches.length !== 3) {
						throw new Error("Invalid input string");
					}
					logger.info(
						`Session QR CODE: ${`wbot-${whatsapp.id}`}-ID: ${whatsapp.id}-${whatsapp.status}`,
					);
					await whatsapp.update({
						qrcode: urlCode,
						status: "qrcode",
						retries: attempt,
					});
					const response = {
						type: matches[1],
						data: Buffer.from(matches[2], "base64"),
					};
					fs.writeFile(qrCodePath, response.data, "binary", (err) => {
						if (err) {
							console.error("Erro ao salvar QR Code:", err);
						}
					});
					io.emit(`${tenantId}:whatsappSession`, {
						action: "update",
						session: whatsapp,
					});
				},
				statusFind: async (statusSession: string, _session: string) => {
					if (statusSession === "isLogged") {
					}
					if (statusSession === "qrReadFail") {
						logger.error(`Session: ${sessionName}-AUTHENTICATION FAILURE`);
						if (whatsapp.retries > 1) {
							await whatsapp.update({
								retries: 0,
								session: "",
							});
						}
						const retry = whatsapp.retries;
						await whatsapp.update({
							status: "DISCONNECTED",
							retries: retry + 1,
						});
						io.emit(`${tenantId}:whatsappSession`, {
							action: "update",
							session: whatsapp,
						});
					}
					if (
						statusSession === "autocloseCalled" ||
						statusSession === "desconnectedMobile"
					) {
						const sessionIndex = sessions.findIndex(
							(s) => s.id === whatsapp.id,
						);
						if (sessionIndex !== -1) {
							try {
								await sessions[sessionIndex].logout();
								await sessions[sessionIndex].close();
							} catch (error) {
								logger.error(error);
							}
							whatsapp.update({
								status: "DISCONNECTED",
								qrcode: "",
								retries: 0,
								phone: "",
								session: "",
							});
							io.emit(`${tenantId}:whatsappSession`, {
								action: "update",
								session: whatsapp,
							});
							sessions.splice(sessionIndex, 1);
						}
					}
					if (statusSession === "inChat") {
						if (fs.existsSync(qrCodePath)) {
							fs.unlink(qrCodePath, () => {});
						}
					}
				},
				logQR: true,
			}),
		)) as unknown as Session;
		// Atualizar a lista de sessões
		const sessionIndex = sessions.findIndex((s) => s.id === whatsapp.id);
		if (sessionIndex === -1) {
			wbot.id = whatsapp.id;
			sessions.push(wbot);
		} else {
			sessions[sessionIndex] = wbot;
		}
		start(wbot);
		await wbot.setOnlinePresence(true);
		return wbot;
	} catch (error) {
		throw new Error(`Erro ao inicializar a sessão: ${error}`);
	}
};
const start = async (client: Session) => {
	try {
		const io = getIO();
		const isReady = await client.isAuthenticated();
		if (isReady) {
			logger.info(`Session: ${sessionName} AUTHENTICATED`);

			const wbotVersion = await client.getWAVersion();
			const profileSession = await client.getProfileName();
			await whatsappSession.update({
				status: "CONNECTED",
				qrcode: "",
				retries: 0,
				// number: wbot?.info?.wid?.user, // || wbot?.info?.me?.user,
				phone: {
					wbotVersion,
					profileSession,
				},
				session: sessionName,
			});
			io.emit(`${tenantId}:whatsappSession`, {
				action: "update",
				session: whatsappSession,
			});
			io.emit(`${tenantId}:whatsappSession`, {
				action: "readySession",
				session: whatsappSession,
			});
			// wbotMessageListener(client);
		}
	} catch (_error) {}
};
async function removeSession(session: string) {
	try {
		// Defina o caminho da pasta com base no sessionId
		const sessionPath = path.join(
			__dirname,
			"..",
			"..",
			"userDataDir",
			session,
		);

		// Verifique se a pasta existe
		try {
			await promises.access(sessionPath); // Verifica se o caminho é acessível
		} catch {
			// Se não existir, encerre a função
			return;
		}

		// Remova a pasta e todos os seus arquivos
		await promises.rm(sessionPath, { recursive: true, force: true }); // Aguarda a remoção
	} catch (error) {
		logger.error(`Erro ao remover a pasta da sessão ${session}:`, error);
	}
}
export const removeWbot = async (whatsappId: number): Promise<void> => {
	try {
		const io = getIO();
		const sessionIndex = sessions.findIndex((s) => s.id === whatsappId);

		if (sessionIndex !== -1) {
			try {
				await sessions[sessionIndex].logout();
				await sessions[sessionIndex].close();
			} catch (error) {
				logger.error(error);
			}
			removeSession(whatsappSession.name);
			whatsappSession.update({
				status: "DISCONNECTED",
				qrcode: "",
				retries: 0,
				phone: "",
				session: "",
			});
			io.emit(`${tenantId}:whatsappSession`, {
				action: "update",
				session: whatsappSession,
			});
			sessions.splice(sessionIndex, 1);
		}
	} catch (err) {
		logger.error(`removeWbot | Error: ${err}`);
	}
};
export const getWbot = (whatsappId: number): Session => {
	const sessionIndex = sessions.findIndex((s) => s.id === Number(whatsappId));
	if (sessionIndex === -1) {
		throw new Error("ERR_WAPP_NOT_INITIALIZED");
	}

	return sessions[sessionIndex];
};
