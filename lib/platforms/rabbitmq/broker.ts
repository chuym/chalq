import Task, { SerializedTask } from "../../task";
import Broker from "../../broker";
import { connect, Channel, Message } from "amqplib";

const MessageMap : Map<string, Message> = new Map();

class RabbitMQBroker extends Broker {
    private publish: Channel
    private consume: Channel

    constructor(cs: string) {
        super();
        this.setMaxListeners(Infinity);
        connect(cs)
            .then(conn => Promise.all([conn.createChannel(), conn.createChannel()]))
            .then(([publish, consume]) => {
                this.publish = publish;
                this.consume = consume;
            });
    }

    enqueue(task: Task): Promise<Task> {
        return new Promise((resolve, reject) => {
            if (!this.publish) reject('Broker not initialized');

            const serialized = JSON.stringify(task.serialize());

            this.publish.assertQueue(task.name);
            this.publish.sendToQueue(task.name, new Buffer(serialized), { persistent: true });

            this.emit(`${task.name}:new`);

            resolve(task);
        });
    }

    async dequeue(name: string): Promise<Task> {
        const message = await this.consume.get(name, { noAck: false });

        if (isMessage(message)) {
            const raw = message.content.toString();
            const serialized = JSON.parse(raw);
            const task = Task.unserialize(serialized);

            MessageMap.set(task.id, message);

            return task;
        } else {
            return null;
        }
    }

    async tasksCount(name: string): Promise<Number> {
        const asserted = await this.publish.assertQueue(task.name);

        return asserted.messageCount;
    }

    findTask(name: string, id: string): Promise<Task> {
        throw new Error('Finding a task with a RabbitMQ is not yet supported');
    }

    ack(status: string, task: Task, result: any): void {
        const message = MessageMap.get(task.id);

        this.consume.ack(message);
        this.emit(`${task.name}:${task.id}:${status}`, result);

        if (status === "failed" && task.opts.retries > 0) {
            task.opts.retries -= 1;

            this.enqueue(Task.unserialize(task));
        }
    }
}

function isMessage(msg: any) : msg is Message {
    return msg.contents !== undefined;
}

export default RabbitMQBroker;
