export default {
	secret: process.env.JWT_SECRET || "a151815d95fea4601780c2c673450f7f",
	expiresIn: "3d",
	refreshSecret:
		process.env.JWT_REFRESH_SECRET || "e14a39e983a9a2d4f26b2b1451ef6815",
	refreshExpiresIn: "7d",
};
