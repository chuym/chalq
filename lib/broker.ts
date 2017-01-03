import { EventEmitter } from "events";
import Task from "./task";

interface BrokerConfig {
    name: string,
    connectionString: string
}

abstract class Broker extends EventEmitter {
    public abstract enqueue(task: Task): Promise<Task>;
    public abstract dequeue(name: string): Promise<Task>;
    public abstract tasksCount(name: string): Promise<Number>;
    public abstract findTask(name: string, id: string): Promise<Task>;
    public abstract ack(status: string, task: Task, result: any): void;
}

export { Broker as default, BrokerConfig };
