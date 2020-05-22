declare namespace Express {
    export interface Application {
        logger: Logger;
        metrics: any;
        conf: object;
        info: object;
    }
}
