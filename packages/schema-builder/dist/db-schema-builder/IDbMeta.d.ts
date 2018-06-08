export interface IDbMeta {
    version: number;
    schemas?: {
        [name: string]: {
            name: string;
            oldName?: string;
            tables?: {
                [name: string]: {
                    schemaName: string;
                    oldSchemaName?: string;
                    name: string;
                    oldName?: string;
                    exposedNames?: [string];
                    description?: string;
                    extensions?: {
                        [name: string]: any;
                    };
                    columns: {
                        [name: string]: {
                            name: string;
                            oldName?: string;
                            description?: string;
                            type: 'computed' | 'customResolver' | 'varchar' | 'int4' | 'float8' | 'bool' | 'uuid' | 'jsonb' | 'relation' | 'enum' | 'customType';
                            customType?: string;
                            defaultValue?: {
                                isExpression: boolean;
                                value: 'string';
                            };
                            relationName?: string;
                            constraintNames?: [string];
                            extensions?: {
                                [name: string]: any;
                            };
                        };
                    };
                    constraints?: {
                        [name: string]: {
                            name: string;
                            type: 'PRIMARY KEY' | 'notnull' | 'UNIQUE' | 'CHECK';
                            columns?: [string];
                            options?: [any];
                        };
                    };
                };
            };
            views?: any;
        };
    };
    enums?: {
        [name: string]: {
            name: string;
            values: [string];
            columns?: {
                [name: string]: {
                    schemaName: string;
                    tableName: string;
                    columnName: string;
                };
            };
        };
    };
    relations?: {
        [name: string]: {
            [sideName: string]: IDbRelation;
        };
    };
    exposedNames?: {
        [name: string]: {
            schemaName: string;
            tableName: string;
        };
    };
}
export interface IDbRelation {
    name: string;
    schemaName: string;
    tableName: string;
    columnName?: string;
    virtualColumnName: string;
    type: 'ONE' | 'MANY';
    onUpdate?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
    onDelete?: 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
    description?: string;
    reference?: {
        schemaName: string;
        tableName: string;
        columnName?: string;
    };
}
