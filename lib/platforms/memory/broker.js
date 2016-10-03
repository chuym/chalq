const EventEmitter = require("events");
const Task = require("../../task");

class Broker extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(Infinity);
        this.queues = {};
    }

    enqueue(task) {
        return new Promise((resolve) => {
            if (!(task instanceof Task)) {
                throw new Error("task is not a Task instance");
            }

            this._getQueue(task.name)
                .push(task.serialize());

            this.emit(`${task.name}:new`);

            resolve(task);
        });
    }

    dequeue(name) {
        return new Promise((resolve) => {
            resolve(this._getQueue(name).shift());
        });
    }

    ack(status, task) {
        this.emit(`${task.name}:${task.id}:${status}`);
    }

    _getQueue(name) {
        if (!this.queues[name]) {
            this.queues[name] = [];
        }

        return this.queues[name];
    }
}

module.exports = Broker;
