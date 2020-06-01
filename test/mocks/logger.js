/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
class Logger {
    constructor(confOrLogger = null, args = null) {}
    log(level, info) {}
    child(args) {
        return new Logger();
    }
    close() {}
}

export default Logger;
