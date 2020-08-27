declare namespace Express {
    export interface Application {
        logger: Logger;
        metrics: any;
        conf: any;
        info: object;
    }
}
