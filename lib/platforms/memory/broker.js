const EventEmitter = require("events");

class Broker extends EventEmitter {
    constructor() {
        super();
        this.queues = {};
    }

    enqueue(task) {
        return new Promise((resolve) => {
            this._getQueue(task.name)
                .push(task.serialize());

            resolve(task);
        });
    }

    _getQueue(name) {
        if (!this.queues[name]) {
            this.queues[name] = [];
        }

        return this.queues[name];
    }
}

module.exports = Broker;
