import {AppEntity, InstalledAppEntity, ShopEntity} from "../model";
import {Bindings} from "../index";

export default {
    async upsertShop(shopId: string, version: string, baseUrl: string, env: Bindings): Promise<ShopEntity> {
        const result = await env.DB.prepare(`
            INSERT INTO shop (id, shopware_version, base_url) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET shopware_version = ?2, base_url = ?3
      `).bind(shopId, version, baseUrl).run()

        return new ShopEntity(shopId, baseUrl, version);
    },

    async addShopSecret(shopId: string, appId: Number, secret: string, appVersion: string, env: Bindings): Promise<void> {
        await env.DB.prepare(`
            INSERT INTO installed_app (shop_id, app_id, shop_secret, app_version) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(shop_id, app_id) DO UPDATE SET shop_secret = ?3, shop_version = ?4
      `).bind(shopId, appId, secret, appVersion).run()
    },

    async saveApiKeys(shopId: string, appId: Number, apiKey: string, secretKey: string, env: Bindings): Promise<void> {
        await env.DB.prepare(`
            UPDATE installed_app SET api_key = ?, secret_key = ? WHERE shop_id = ? AND app_id = ?
      `).bind(apiKey, secretKey, shopId, appId).run()
    },

    async getInstalledApp(shopId: string, appId: Number, env: Bindings): Promise<InstalledAppEntity> {
        const result = await env.DB.prepare(`
            SELECT * FROM installed_app
            JOIN shop ON shop.id = installed_app.shop_id
            JOIN app ON app.id = installed_app.app_id
            WHERE shop_id = ? AND app_id = ?
        `).bind(shopId, appId).all()

        const row = result.results.pop();

        if (!row) {
            throw new Error(`Installed app with shopId ${shopId} and appId ${appId} not found`);
        }

        return new InstalledAppEntity(
            row.shop_id as string,
            row.app_id as number,
            row.api_key as string|undefined,
            row.secret_key as string|undefined,
            row.shop_secret as string,
            row.app_version as string,
            new ShopEntity(row.shop_id as string, row.shop_url as string, row.shopware_version as string),
            new AppEntity(row.app_id as number, row.app_name as string, row.app_secret as string)
        );
    },
    uninstallApp(shopId: string, appId: number, env: Bindings): void {
        env.DB.prepare(`
            DELETE FROM installed_app WHERE shop_id = ? AND app_id = ?
        `).bind(shopId, appId).run();

        env.DB.prepare(`
            DELETE FROM shop WHERE (SELECT COUNT(*) FROM installed_app WHERE shop_id = ?) = 0
        `).bind(shopId).run();
    }
}