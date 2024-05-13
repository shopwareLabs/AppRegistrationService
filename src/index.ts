import { Hono } from 'hono'
import appController from './app/controller'
import shopController from './shop/controller'

export type Bindings = {
  DB: D1Database;
  BASE_URL: string;
}

const app = new Hono<{ Bindings: Bindings }>();
app.route('/app', appController);
app.route('/shop', shopController);


export default app
