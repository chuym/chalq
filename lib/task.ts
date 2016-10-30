import * as _ from "lodash";
import { EventEmitter } from "events";
import { v4 } from "node-uuid";

interface TaskOptions {
    retries? : number
}

interface SerializedTask {
    id : string,
    name : string
    args : Array<any>
    opts : TaskOptions
}


class Task extends EventEmitter {
    public id : string
    public name : string
    private args : Array<any>
    private opts : TaskOptions

    constructor(name : string, args : Array<any>, opts : TaskOptions) {
        super();

        this.id = v4();
        this.name = name;
        this.args = args;
        this.opts = _.pick(opts, ["retries"]);
    }

    serialize() : SerializedTask {
        return {
            id: this.id,
            name: this.name,
            args: this.args,
            opts: this.opts
        };
    }

    static unserialize(serialized : SerializedTask) : Task {
        const task = new Task(serialized.name, serialized.args, serialized.opts);

        task.id = serialized.id;

        return task;
    }
}

export { Task, SerializedTask };
