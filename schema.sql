DROP TABLE IF EXISTS app;
CREATE TABLE IF NOT EXISTS app (id INTEGER PRIMARY KEY AUTOINCREMENT, app_name TEXT NOT NULL, app_secret TEXT NOT NULL);

-- ToDo maybe denormalize and store shop info per app?
DROP TABLE IF EXISTS shop;
CREATE TABLE IF NOT EXISTS shop (id TEXT PRIMARY KEY, shopware_version TEXT NOT NULL, base_url TEXT NOT NULL);

DROP TABLE IF EXISTS installed_app;
CREATE TABLE IF NOT EXISTS installed_app (app_id INTEGER, shop_id TEXT, api_key TEXT, secret_key TEXT, shop_secret TEXT NOT NULL, app_version TEXT NOT NULL, PRIMARY KEY (app_id, shop_id), FOREIGN KEY(app_id) REFERENCES app(id), FOREIGN KEY(shop_id) REFERENCES shop(id));