import {GoldenSun} from "GoldenSun";

export enum msg_types {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
}

/**
 * This class is responsible to log messages mainly in case of
 * user bad input. If you're running desktop app, it will create
 * a log file inside logs directory.
 */
export class Logger {
    private data: GoldenSun;

    constructor(data: GoldenSun) {
        this.data = data;
        this.log_message("Engine started.", msg_types.INFO);
    }

    log_message(message: string, type: msg_types = msg_types.WARNING) {
        if (!message) {
            return;
        }
        const now = new Date().toLocaleString();
        switch (type) {
            case msg_types.INFO:
                message = `GSHTML5 - [${now}] [INFO]: ${message}`;
                console.log(message);
                break;
            case msg_types.WARNING:
                message = `GSHTML5 - [${now}] [WARNING]: ${message}`;
                console.warn(message);
                break;
            case msg_types.ERROR:
                message = `GSHTML5 - [${now}] [ERROR]: ${message}`;
                console.error(message);
                break;
            default:
                return;
        }
        if (this.data.electron_app) {
            this.data.ipcRenderer.send("register-log", message);
        }
    }
}
