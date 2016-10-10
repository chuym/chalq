const _ = require("lodash");
const os = require("os");
const should = require("chai").should();

const MemoryBroker = require("../lib/platforms/memory/broker");
const Task = require("../lib/task");
const Worker = require("../lib/worker");

// Note, several of these tests tap into private properties and methods. The usage depicted in these
// tests are not ideal and should not be used as example.
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
            const task = new Task("foo", [1, 2]);
            broker.enqueue(task);

            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });

            worker.should.be.instanceof(Worker);

            broker.once(`foo:${task.id}:success`, done);
        });

        it("should ack tasks with success for successful tasks", function (done) {
            function handler(a, b) {
                return new Promise(resolve => resolve(a + b));
            }

            const broker = new MemoryBroker();
            const task = new Task("foo", [1, 2]);
            broker.enqueue(task);

            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });

            worker.should.be.instanceof(Worker);

            broker.once(`foo:${task.id}:success`, done);
        });
        it("should ack tasks with failed for failed tasks", function (done) {
            function handler() {
                return new Promise((resolve, reject) => reject("error"));
            }

            const broker = new MemoryBroker();
            const task = new Task("foo", [1, 2]);
            broker.enqueue(task);

            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });

            worker.should.be.instanceof(Worker);

            broker.once(`foo:${task.id}:failed`, done);
        });

        it("should pause until new items arrive queue if empty", function (done) {
            function handler(a, b) {
                return new Promise(resolve => resolve(a + b));
            }

            const broker = new MemoryBroker();
            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });
            const task = new Task("foo", [1, 2]);

            worker.should.be.instanceof(Worker);

            const afterTwo = _.after(2, done);

            broker.on(`foo:${task.id}:success`, afterTwo);

            setTimeout(() => broker.enqueue(task), 0);
            setTimeout(() => broker.enqueue(task), 33);
        });

        it("should abort if dequeueing rejects", function (done) {
            function handler(a, b) {
                return new Promise(resolve => resolve(a + b));
            }

            const broker = new MemoryBroker();
            broker.dequeue = () => Promise.reject("Failed to dequeue!");

            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });
            const task = new Task("foo", [1, 2]);

            worker.should.be.instanceof(Worker);

            broker.enqueue(task);

            // Give some time for the enqueueing operation to fail.
            setTimeout(() => {
                const status = worker._processes[0].status();
                status.should.equal("stopped");
                done();
            }, 10);
        });

        it("should stop processing if stoping process", function (done) {
            function handler(a, b) {
                return new Promise(resolve => resolve(a + b));
            }

            const broker = new MemoryBroker();
            const worker = new Worker(broker, "foo", handler, {
                concurrency: 1
            });
            const task = new Task("foo", [1, 2]);

            worker.should.be.instanceof(Worker);

            broker.once(`foo:${task.id}:success`, () => {
                worker.stop();
                worker._processes.forEach(p => p.status().should.equal("stopped"));
                broker.on(`foo:${task.id}:success`, () => done("Should be called after stop"));

                broker.enqueue(task);
                setTimeout(() => {
                    broker._getQueue("foo").should.have.lengthOf(1);
                    done();
                }, 33);
            });

            setTimeout(() => broker.enqueue(task), 0);
        });
    });
});
