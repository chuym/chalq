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

    tasksCount(name) {
        return this._getQueue(name).length;
    }

    findTask(name, id) {
        const serialized = this._getQueue(name).find(t => t.id === id);

        if (serialized === undefined) return null;

        return Task.unserialize(serialized);
    }

    ack(status, task, result) {
        this.emit(`${task.name}:${task.id}:${status}`, result);

        if (status === "failed" && task.opts.retries > 0) {
            task.opts.retries -= 1;

            this.enqueue(Task.unserialize(task));
        }
    }

    _getQueue(name) {
        if (!this.queues[name]) {
            this.queues[name] = [];
        }

        return this.queues[name];
    }
}

module.exports = Broker;
