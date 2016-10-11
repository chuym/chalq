const _ = require("lodash");

const MemoryBroker = require("./platforms/memory/broker");

const Task = require("./task");
const Worker = require("./worker");

let broker;
let tasks = {};

const KNOWN_STATES = ["failed", "success"];

const otherStates = _.memoize(state => _.without(KNOWN_STATES, state));

class Chalq {
    static initialize(config = { broker: { name: "memory" } }) {
        if (broker) throw new Error("Chalq is already initialized");

        switch (config.broker.name) {
        case "memory":
            broker = new MemoryBroker();
            break;
        default:
            throw new Error("Unknown broker type");
        }
    }

    static registerTask(name, handler) {
        if (!broker) throw new Error("Chalq has not been initialized");
        if (tasks[name]) throw new Error("A task with this name has already been registered");
        if (!_.isFunction(handler)) throw new Error("Handler is not a function");

        tasks[name] = new Proxy({ name, handler }, {
            get(target, method) {
                if (method === "run") {
                    return _.partial(Chalq.runTask, target.name);
                } else if (method === "startWorker") {
                    return opts => new Worker(broker, name, handler, opts);
                } else if (method === "count") {
                    return _.bind(broker.tasksCount, broker, name);
                } else if (method === "find") {
                    return _.bind(broker.findTask, broker, name);
                }

                return undefined;
            }
        });
    }

    static runTask(name, args, opts = {}) {
        if (!broker) throw new Error("Chalq has not been initialized");
        if (!tasks[name]) throw new Error(`Task '${name}' is not defined`);

        const task = new Task(name, args, opts);

        return broker.enqueue(task)
            .then(() => {
                let handlers = new Map();

                handlers = ["failed", "success"].reduce((map, state) => {
                    map.set(state, (result) => {
                        const others = otherStates(state);

                        others.forEach(s => broker.removeListener(`${name}:${task.id}:${s}`,
                                                                  handlers.get(s)));
                        task.emit(state, result);
                    });

                    return map;
                }, handlers);

                ["failed", "success"].forEach((state) => {
                    broker.once(`${name}:${task.id}:${state}`, handlers.get(state));
                });

                return task;
            });
    }

    static isReady() {
        return !!broker;
    }

    static destroy() {
        broker = null;
        tasks = {};
    }
}

// Proxy event-related functions to the broker
["on", "once", "removeListener", "removeAllListeners"].forEach((method) => {
    Chalq[method] = (...args) => {
        if (!broker) throw new Error("Chalq has not been initialized");

        broker[method](...args);
    };
});

const proxy = new Proxy(Chalq, {
    get(target, name) {
        return name in target ? target[name] : tasks[name];
    }
});

module.exports = proxy;
