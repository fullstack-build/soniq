import { Verifier } from './Verifier';
export declare class DefaultVerifier extends Verifier {
    verify(verifyFileName: any, fName: any): Promise<void>;
    getObjectNames(fName: any): {
        objectName: any;
        info: string;
    }[];
}
