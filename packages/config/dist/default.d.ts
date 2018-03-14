declare const _default: {
    core: {
        namespace: string;
    };
    eventEmitter: {};
    graphql: {
        endpoint: string;
        graphiQlEndpoint: string;
        schemaPattern: string;
        viewsPattern: string;
        expressionsPattern: string;
        resolversPattern: string;
    };
    db: {
        viewSchemaName: string;
        updateClientListInterval: number;
    };
    auth: {
        sodium: {};
        oAuth: {
            cookie: {
                maxAge: number;
                overwrite: boolean;
                httpOnly: boolean;
                signed: boolean;
            };
            providers: {
                facebook: {
                    name: string;
                    tenant: string;
                    strategy: any;
                    config: {
                        clientID: number;
                        clientSecret: string;
                        profileFields: string[];
                    };
                };
                google: {
                    name: string;
                    tenant: string;
                    strategy: any;
                    config: {
                        clientID: string;
                        clientSecret: string;
                        profileFields: string[];
                    };
                };
            };
            frontendOrigins: string[];
            serverApiAddress: string;
        };
        cookie: {
            name: string;
            maxAge: number;
            overwrite: boolean;
            httpOnly: boolean;
            signed: boolean;
        };
        tokenQueryParameter: string;
        enableDefaultLocalStrategie: boolean;
    };
};
export = _default;
