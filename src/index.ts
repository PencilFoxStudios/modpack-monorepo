import { fromHono } from "chanfana";
import { Hono } from "hono";
import fs from 'fs';
// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
// const openapi = fromHono(app, {
// 	docs_url: "/",
// });



// Get list of all available modpacks via listing the /modpacks directory using fs. only get names of subdirectories
app.get('/modpacks', (c) => {
	const modpacks = fs.readdirSync('/modpacks').filter((file) => {
		return fs.statSync(`/modpacks/${file}`).isDirectory();
	});
	return c.json(modpacks);
});

// Export the Hono app
export default app;
