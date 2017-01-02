const amqp = require("amqplib");
const should = require("chai").should();

const Broker = require("../../../dist/platforms/rabbitmq/broker").default;
const Task = require("../../../dist/task").default;

function cleanQueue(done) {
    amqp.connect("amqp://rabbitmq").then((conn) => {
        conn.createChannel().then((ch) => {
            ch.assertQueue("chalq_unit_test");
            ch.deleteQueue("chalq_unit_test").then(() => {
                done();
            });
        });
    });
}

describe("RabbitMQ Broker", function () {
    beforeEach(cleanQueue);
    after(cleanQueue);

    describe("constructor", function () {
        it("should initialize a rabbitmq broker", function (done) {
            const broker = new Broker("amqp://rabbitmq");

            broker.once("ready", done);
        });
    });

    describe("enqueue", function () {
        it("should enqueue a task", function (done) {
            const broker = new Broker("amqp://rabbitmq");
            const task = new Task("chalq_unit_test", [1, 2]);

            broker.once("ready", () => {
                broker.enqueue(task)
                    .then(() => done())
                    .catch(done);
            });
        });

        it("should reject if passed task is not of Task instance", function (done) {
            const broker = new Broker("amqp://rabbitmq");

            broker.once("ready", () => {
                broker.enqueue({ foo: "bar" })
                    .then(() => done("Should not have been enqueued"))
                    .catch(() => done());
            });
        });
    });

    describe("dequeue", function () {
        it("should dequeue a task", function (done) {
            const broker = new Broker("amqp://rabbitmq");
            const task = new Task("chalq_unit_test", [1, 2]);

            broker.once("ready", () => {
                broker.enqueue(task)
                    .then(() => broker.dequeue("chalq_unit_test"))
                    .then((dequeued) => {
                        should.exist(dequeued);
                        dequeued.name.should.equal("chalq_unit_test");
                        dequeued.args.should.eql([1, 2]);
                        dequeued.id.should.be.a("string");
                        done();
                    })
                    .catch(done);
            });
        });

        it("if empty, it should return null", function (done) {
            const broker = new Broker("amqp://rabbitmq");

            broker.once("ready", () => {
                broker.dequeue("chalq_unit_test")
                    .then(dequeued => should.not.exist(dequeued))
                    .then(() => done())
                    .catch(done);
            });
        });
    });
});
