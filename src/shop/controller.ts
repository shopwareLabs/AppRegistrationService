import {Context, Hono} from 'hono'
import {Bindings} from "../index";
import appRepository from "../app/repository";
import {WebCryptoHmacSigner} from "shopware-app-server-sdk/component/signer";
import repository from "./repository";
import {randomString} from "shopware-app-server-sdk/util";
import {InstalledAppEntity} from "../model";

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

    await repository.addShopSecret(
        shop.id,
        app.id,
        shopSecret,
        c.req.header('sw-version') as string,
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

    const installedApp = await verifyPost(bodyContent, body.shopId as string, c);

    repository.saveApiKeys(
        installedApp.shopId,
        installedApp.appId,
        body.apiKey as string,
        body.secretKey as string,
        c.env
    );

    return c.newResponse(null, 204);
});

app.post('/onShopwareUpdate/:id', async (c) => {
    const bodyContent = await c.req.text();
    const body = JSON.parse(bodyContent);

    const installedApp = await verifyPost(bodyContent, body.source.shopId as string, c);

    await repository.upsertShop(installedApp.shopId, body.payload.newVersion as string, installedApp.shop.shopUrl, c.env);

    return c.newResponse(null, 204);
});

app.post('/onAppUpdate/:id', async (c) => {
    const bodyContent = await c.req.text();
    const body = JSON.parse(bodyContent);

    const installedApp = await verifyPost(bodyContent, body.source.shopId as string, c);

    await repository.addShopSecret(installedApp.shopId, installedApp.appId, installedApp.secretKey as string, body.payload.appVersion as string, c.env);

    return c.newResponse(null, 204);
});

app.post('/onAppUninstall/:id', async (c) => {
    const bodyContent = await c.req.text();
    const body = JSON.parse(bodyContent);

    const installedApp = await verifyPost(bodyContent, body.source.shopId as string, c);

    await repository.uninstallApp(installedApp.shopId, installedApp.appId, c.env);

    return c.newResponse(null, 204);
});

async function verifyPost(bodyContent: string, shopId: string, c: Context): Promise<InstalledAppEntity>{

    // ToDo request validation
    const installedApp = await repository.getInstalledApp(
        shopId,
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
    return installedApp;
}

export default app