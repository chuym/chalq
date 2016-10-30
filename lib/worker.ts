import * as _ from "lodash";
import * as os from "os";
import Broker from "./broker";
import { TaskHandler } from "./task";

interface WorkerOptions {
    concurrency: number
}

interface WorkerProcess {
    stop: Function
    status: Function
}

class Worker {
    private broker: Broker;
    private handler: TaskHandler;
    private taskName: string;
    private _processes: Array<WorkerProcess>;
    private concurrency: Number;

    constructor(broker: Broker, taskName: string, handler: TaskHandler, opts = <WorkerOptions>{}) {
        if (!broker) throw new Error("Missing broker");
        if (!_.isString(taskName)) throw new Error("Missing task name");
        if (!_.isFunction(handler)) throw new Error("Missing handler");

        _.defaults(opts, {
            concurrency: os.cpus().length
        });

        this.broker = broker;
        this.handler = handler;
        this.taskName = taskName;

        this._processes = _.times(opts.concurrency, () => this.startProcess());
    }

    startProcess(): WorkerProcess {
        let stop = false;

        const broker = this.broker;
        const handler = this.handler;
        const name = this.taskName;

        async function runNext() {
            if (stop) return;

            try {
                const task = await broker.dequeue(name);
                if (!task) {
                    broker.once(`${name}:new`, runNext);
                    return;
                }

                try {
                    const result = await handler(...task.args)
                    broker.ack("success", task, result);
                } catch (err) {
                    broker.ack("failed", task, err);
                }
                runNext();
            } catch (err) {
                console.log("Failed to dequeue next task, worker exiting.", err);
                stop = true;
                broker.removeListener(`${name}:task:new`, runNext);
            };
        }

        runNext();

        return {
            stop(): void {
                stop = true;
                broker.removeListener(`${name}:task:new`, runNext);
            },
            status(): string {
                return stop ? "stopped" : "started";
            }
        };
    }

    stop(): void {
        this._processes.forEach(p => p.stop());
    }
}

export default Worker;
