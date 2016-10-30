import { EventEmitter } from "events";
import Task, { SerializedTask } from "../../task";
import Broker from "../../broker";

class MemoryBroker extends Broker {
    private queues: Map<String, Array<SerializedTask>>

    constructor() {
        super();
        this.setMaxListeners(Infinity);
        this.queues = new Map<String, Array<SerializedTask>>();
    }

    enqueue(task: Task): Promise<Task> {
        return new Promise((resolve) => {
            this.getQueue(task.name)
                .push(task.serialize());

            this.emit(`${task.name}:new`);

            resolve(task);
        });
    }

    dequeue(name: string): Promise<Task> {
        return new Promise((resolve) => {
            resolve(this.getQueue(name).shift());
        });
    }

    tasksCount(name: string): Promise<Number> {
        return Promise.resolve(this.getQueue(name).length);
    }

    findTask(name: string, id: string): Promise<Task> {
        const serialized = this.getQueue(name).find(t => t.id === id);

        if (serialized === undefined) return Promise.resolve(null);

        return Promise.resolve(Task.unserialize(serialized));
    }

    ack(status: string, task: Task, result: any): void {
        this.emit(`${task.name}:${task.id}:${status}`, result);

        if (status === "failed" && task.opts.retries > 0) {
            task.opts.retries -= 1;

            this.enqueue(Task.unserialize(task));
        }
    }

    private getQueue(name: string): Array<SerializedTask> {
        if (!this.queues.has(name)) {
            this.queues.set(name, []);
        }

        return this.queues.get(name);
    }
}

export default MemoryBroker;
