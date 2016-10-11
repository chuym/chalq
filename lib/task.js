const _ = require("lodash");
const EventEmitter = require("events");
const uuid = require("uuid").v4;

class Task extends EventEmitter {
    constructor(name, args, opts = {}) {
        super();

        this.id = uuid();
        this.name = name;
        this.args = args;
        this.opts = _.pick(opts, ["retries"]);
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            args: this.args,
            opts: this.opts
        };
    }

    static unserialize(serialized) {
        const task = new Task(serialized.name, serialized.args, serialized.opts);

        task.id = serialized.id;

        return task;
    }
}

module.exports = Task;
