const should = require("chai").should();

const MemoryBroker = require("../../../lib/platforms/memory/broker");
const Task = require("../../../lib/task");

describe("Memory Broker", function () {
    describe("constructor", function () {
        it("should initialize a memory broker", function () {
            const broker = new MemoryBroker();

            broker.should.be.instanceof(MemoryBroker);
        });
    });

    describe("enqueue", function () {
        it("should enqueue a task", function (done) {
            const broker = new MemoryBroker();
            const task = new Task("foo", [1, 2]);

            broker.enqueue(task)
                .then(() => done())
                .catch(done);
        });

        it("should reject if passed task is not of Task instance", function (done) {
            const broker = new MemoryBroker();

            broker.enqueue({ foo: "bar" })
                .then(() => done("Should not have been enqueued"))
                .catch(() => done());
        });
    });

    describe("dequeue", function () {
        it("should dequeue a task", function (done) {
            const broker = new MemoryBroker();
            const task = new Task("foo", [1, 2]);

            broker.enqueue(task)
                .then(() => broker.dequeue("foo"))
                .then((dequeued) => {
                    should.exist(dequeued);
                    dequeued.name.should.equal("foo");
                    dequeued.args.should.eql([1, 2]);
                    dequeued.id.should.be.a("string");
                    done();
                })
                .catch(done);
        });
        it("if empty, it should return null", function (done) {
            const broker = new MemoryBroker();

            broker.dequeue("foo")
                .then(dequeued => should.not.exist(dequeued))
                .then(() => done())
                .catch(done);
        });
    });
});
