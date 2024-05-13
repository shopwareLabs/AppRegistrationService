import { Hono } from 'hono'
import {Bindings} from "../index";
import repository from "./repository";
import shopRepository from "../shop/repository";


const app = new Hono<{ Bindings: Bindings }>();

app.post('/', async (c) => {
    // ToDo request validation
    const body = await c.req.json()

    const app = await repository.createApp(body.appName, body.secret, c.env)

    return c.json(app);
});
app.get('/:appId/shop/:shopId', async (c) => {
    // ToDo request validation
    const installedApp = await shopRepository.getInstalledApp(c.req.param('shopId'), Number(c.req.param('appId')), c.env);

    if (c.req.header('sw-app-secret') !== installedApp.app.secret) {
        throw new Error('Invalid app secret');
    }

    return c.json(installedApp);
});

export default app