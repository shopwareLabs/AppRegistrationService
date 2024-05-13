import {Hono} from 'hono'
import {Bindings} from "../index";
import appRepository from "../app/repository";
import {WebCryptoHmacSigner} from "shopware-app-server-sdk/component/signer";
import repository from "./repository";
import {randomString} from "shopware-app-server-sdk/util";

const app = new Hono<{ Bindings: Bindings }>();

app.get('/register/:id', async (c) => {
    // ToDo request validation
    const app = await appRepository.getApp(Number(c.req.param('id')), c.env);

    const signer = new WebCryptoHmacSigner();
    const v = await signer.verify(
        c.req.header('shopware-app-signature') as string,
        `shop-id=${c.req.query('shop-id')}&shop-url=${
            c.req.query('shop-url')
        }&timestamp=${c.req.query('timestamp')}`,
        app.secret,
    );

    if (!v) {
        throw new Error('Invalid signature ' + app.secret);
    }

    const shop = await repository.upsertShop(
        c.req.query('shop-id') as string,
        c.req.header('sw-version') as string,
        c.req.query('shop-url') as string,
        c.env
    );

    const shopSecret = randomString();

    repository.addShopSecret(
        shop.id,
        app.id,
        shopSecret,
        c.env
    );

    return c.json(
        {
            proof: await signer.sign(
                shop.id + shop.shopUrl + app.appName,
                app.secret,
            ),
            secret: shopSecret,
            confirmation_url: c.env.BASE_URL + '/shop/confirm/' + app.id.toString(),
        }
    );
});
app.post('/confirm/:id', async (c) => {
    const bodyContent = await c.req.text();
    const body = JSON.parse(bodyContent);

    // ToDo request validation
    const installedApp = await repository.getInstalledApp(
        body.shopId as string,
        Number(c.req.param('id')),
        c.env
    );

    const signer = new WebCryptoHmacSigner();
    const v = await signer.verify(
        c.req.header('shopware-shop-signature') as string,
        bodyContent,
        installedApp.shopSecret,
    );

    if (!v) {
        throw new Error('Invalid signature');
    }

    repository.saveApiKeys(
        installedApp.shopId,
        installedApp.appId,
        body.apiKey as string,
        body.secretKey as string,
        c.env
    );

    return c.newResponse(null, 204);
});

export default app