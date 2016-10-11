const EventEmitter = require("events");
const uuid = require("uuid").v4;

class Task extends EventEmitter {
    constructor(name, args) {
        super();
        this.id = uuid();
        this.name = name;
        this.args = args;
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            args: this.args
        };
    }

    static unserialize(serialized) {
        const task = new Task(serialized.name, serialized.args);

        task.id = serialized.id;

        return task;
    }
}

module.exports = Task;
