import {AppEntity} from "../model";
import {Bindings} from "../index";

export default {
    async createApp(appName: string, secret: string, env: Bindings): Promise<AppEntity> {
        // ToDo: unique technical app name?!
        const result = await env.DB.prepare(`
            INSERT INTO app (app_name, app_secret) VALUES (?, ?)
      `).bind(appName, secret).run()

        return new AppEntity(result.meta.last_row_id, appName, secret);
    },

    async getApp(appId: number, env: Bindings): Promise<AppEntity> {
        const result = await env.DB.prepare(`
            SELECT * FROM app WHERE id = ?
      `).bind(appId).all();

        const row = result.results.pop();

        if (!row) {
            throw new Error(`App with id ${appId} not found`);
        }

        return new AppEntity(row.id as number, row.app_name as string, row.app_secret as string);
    }
}