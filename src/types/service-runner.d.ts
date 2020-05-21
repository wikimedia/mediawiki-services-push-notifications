export = service_runner;

/**
 * Fairly generic cluster-based web service runner. Starts several instances
 * of a worker module (in this case the restface module), and manages restart
 * and graceful shutdown. The worker module can also be started independently,
 * which is especially useful for debugging.
 */
declare class service_runner {
    constructor(...options: any[]);
    start(conf?: any): any;
    stop(): any;
    static getLogger(loggerConf?: any): Logger;
    static getMetrics(metricsConf?: any, logger?: Logger): any;
}
