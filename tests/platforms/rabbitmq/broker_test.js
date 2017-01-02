const should = require("chai").should();

const Broker = require("../../../dist/platforms/rabbitmq/broker").default;
const Task = require("../../../dist/task").default;

describe("RabbitMQ Broker", function () {
    describe("constructor", function () {
        it("should initialize a rabbitmq broker", function (done) {
            const broker = new Broker("amqp://localhost");

            broker.once("ready", done);
        });
    });

    describe("enqueue", function () {
        it("should enqueue a task", function (done) {
            const broker = new Broker("amqp://localhost");
            const task = new Task("foo", [1, 2]);

            broker.once("ready", () => {
                broker.enqueue(task)
                    .then(() => done())
                    .catch(done);
            });
        });

        it("should reject if passed task is not of Task instance", function (done) {
            const broker = new Broker("amqp://localhost");

            broker.once("ready", () => {
                broker.enqueue({ foo: "bar" })
                    .then(() => done("Should not have been enqueued"))
                    .catch(() => done());
            });
        });
    });

    describe("dequeue", function () {
        it("should dequeue a task", function (done) {
            const broker = new Broker("amqp://localhost");
            const task = new Task("foo", [1, 2]);

            broker.once("ready", () => {
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
        });

        it("if empty, it should return null", function (done) {
            const broker = new Broker("amqp://localhost");

            broker.once("ready", () => {
                broker.dequeue("empty_queue")
                    .then(dequeued => should.not.exist(dequeued))
                    .then(() => done())
                    .catch(done);
            });
        });
    });
});
