const os = require("os");
const should = require("chai").should();

const MemoryBroker = require("../lib/platforms/memory/broker");
const Task = require("../lib/task");
const Worker = require("../lib/worker");

describe("Worker", function () {
    describe("constructor", function () {
        it("should throw if broker is not a Broker instance", function () {
            should.Throw(() => new Worker(), "Missing broker");
        });
        it("should throw if task name is not provided", function () {
            const broker = new MemoryBroker();
            should.Throw(() => new Worker(broker), "Missing task name");
        });
        it("should throw if handler is not a function", function () {
            const broker = new MemoryBroker();
            should.Throw(() => new Worker(broker, "foo"), "Missing handler");
        });
        it("should accept concurrency option", function () {
            const broker = new MemoryBroker();
            const worker = new Worker(broker, "foo", Promise.resolve, {
                concurrency: 35
            });

            worker.should.be.instanceof(Worker);
            worker._processes.should.have.lengthOf(35);
        });

        it("should spawn a worker with default options", function () {
            const broker = new MemoryBroker();
            const worker = new Worker(broker, "foo", Promise.resolve);

            worker.should.be.instanceof(Worker);
            worker._processes.should.have.lengthOf(os.cpus().length);
        });
    });

    describe("startProcess", function () {
        it("should dequeue items from queue", function (done) {
            function handler(a, b) {
                return new Promise(resolve => resolve(a + b));
            }

            const broker = new MemoryBroker();
            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });
            const task = new Task("foo", [1, 2]);

            worker.should.be.instanceof(Worker);

            broker.once(`foo:${task.id}:success`, done);

            setTimeout(() => broker.enqueue(task), 0);
        });
        it("should pause until new items arrive queue if empty");
        it("should abort if dequeueing throws");
        it("should stop processing if stoping process");
        it("should ack tasks with success for successful tasks");
        it("should ack tasks with failed for failed tasks");
    });
});
