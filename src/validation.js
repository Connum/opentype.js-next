import { isBrowser } from './util.js';

const errorTypes = {
    ERROR: 1,
    WARNING: 2,
    DEPRECATED: 4,
    ALL: 32767
};

const errorStrings = {
    1: 'ERROR',
    2: 'WARNING',
    4: 'DEPRECATED'
};

const logMethods = {
    1: 'error',
    2: 'warn',
    4: 'info'
};

class Message {
    string;
    type;
    logged = false;

    constructor(string, type = errorTypes.ERROR) {
        if (!errorStrings[type]) {
            throw new Error( 'Invalid error type ' + type + ' for message: ' + string );
        }

        this.string = string;
        this.type = type;
    }

    toString() {
        return errorStrings[this.type] + ': ' + this.string;
    }
}


class MessageStack {
    #logLevel = errorTypes.ALL;
    #messageStack = [];

    constructor() {
        Object.defineProperty(this, "errorTypes", {
            value: errorTypes,
            writable: false,
            enumerable: true,
            configurable: false
        });
    }

    addMessage(string, type = errorTypes.ERROR) {
        const message = new Message(string, type);
        this.#messageStack.push(message);
        
        if (this.#logLevel & type) {
            this.logMessage(message);
        }

        if (isBrowser()) {
            document.dispatchEvent(new CustomEvent("opentypejs:message", { detail: { message, logLevel: this.#logLevel } }));
        }
    
        return message;
    }
    
    logMessage(message) {
        const type = message.type || errorTypes.ERROR;
        const logMethod = console[logMethods[type] || 'log'] || console.log;
        logMethod('[opentype.js] ' + message.toString());
        message.logged = true;
    }
    
    getMessages() {
        return this.#messageStack;
    }
    
    logMessages() {
        const unloggedMessages = this.#messageStack.filter(m => !m.logged);
        for (let i = 0; i < unloggedMessages.length; i++) {
            const message = unloggedMessages[i];
            this.logMessage(message);
        }
    }
    
    resetMessages() {
        this.#messageStack.length = 0;
    }
    
}

export default { errorTypes, MessageStack };