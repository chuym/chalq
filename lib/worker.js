const _ = require("lodash");
const os = require("os");

class Worker {
    constructor(broker, taskName, handler, opts = {}) {
        if (!broker) throw new Error("Missing broker");
        if (!_.isString(taskName)) throw new Error("Missing task name");
        if (!_.isFunction(handler)) throw new Error("Missing handler");

        _.defaults(opts, {
            concurrency: os.cpus().length
        });

        this.broker = broker;
        this.handler = handler;
        this.taskName = taskName;

        this._processes = _.times(opts.concurrency, this.startProcess.bind(this));
    }

    startProcess() {
        let stop = false;

        const broker = this.broker;
        const handler = this.handler;
        const name = this.taskName;

        function runNext() {
            if (stop) return;

            broker.dequeue(name).then((task) => {
                if (!task) {
                    broker.once(`${name}:task:new`, runNext);
                    return;
                }

                handler(task.args)
                    .then(_.partial(broker.ack, "success", task))
                    .catch(_.partial(broker.ack, "failed", task))
                    .then(runNext, runNext);
            }).catch((err) => {
                console.log("Failed to dequeue next task, worker exiting.", err);
                stop = true;
                broker.removeListener(`${name}:task:new`, runNext);
            });
        }

        runNext();

        return () => {
            stop = true;
            broker.removeListener(`${name}:task:new`, runNext);
        };
    }
}

module.exports = Worker;
