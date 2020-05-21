/**
 * Logger provided by service runner
 */
declare class Logger {
    constructor(confOrLogger: any, args: any);
    /**
     * Logs and info object with a specified level
     * @param {string} level Log level and components, for example 'trace/request'
     * @param {Object|Function} info log statement object, or a callback to lazily construct
     *                               the log statement after we've decided that this particular
     *                               level will be matched.
     */
    log(level: string, info: object|{}): void;
    child(args: any): Logger;
    close(): void;
}
