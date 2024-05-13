export class AppEntity {
    constructor(
        public id: number,
        public appName: string,
        public secret: string
    ) {}
}

export class ShopEntity {
    constructor(
        public id: string,
        public shopUrl: string,
        public shopwareVersion: string
    ) {}
}

export class InstalledAppEntity {
    constructor(
        public shopId: string,
        public appId: number,
        public apiKey: string|undefined,
        public secretKey: string|undefined,
        public shopSecret: string,
        public shop: ShopEntity,
        public app: AppEntity
    ) {}
}