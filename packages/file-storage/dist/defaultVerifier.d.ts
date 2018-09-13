import { Verifier } from './Verifier';
export declare class DefaultVerifier extends Verifier {
    verify(verifyFileName: any, id: any, type: any, extension: any): Promise<void>;
    getObjectNames(id: any, type: any, extension: any): {
        objectName: string;
        info: string;
    }[];
}
