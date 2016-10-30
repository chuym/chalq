import { EventEmitter } from "events";
import Task, { SerializedTask } from "../../task";

class Broker extends EventEmitter {
    private queues : Map<String, Array<SerializedTask>>

    constructor() {
        super();
        this.setMaxListeners(Infinity);
        this.queues = new Map<String, Array<SerializedTask>>();
    }

    enqueue(task : Task) : Promise<Task> {
        return new Promise((resolve) => {
            this.getQueue(task.name)
                .push(task.serialize());

            this.emit(`${task.name}:new`);

            resolve(task);
        });
    }

    dequeue(name : string) : Promise<Task> {
        return new Promise((resolve) => {
            resolve(this.getQueue(name).shift());
        });
    }

    tasksCount(name : string) : Promise<number> {
        return Promise.resolve(this.getQueue(name).length);
    }

    findTask(name, id) {
        const serialized = this.getQueue(name).find(t => t.id === id);

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

    private getQueue(name : string) : Array<SerializedTask> {
        if (!this.queues.has(name)) {
            this.queues.set(name, []);
        }

        return this.queues.get(name);
    }
}

export default Broker;