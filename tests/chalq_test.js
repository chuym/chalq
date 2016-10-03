const _ = require("lodash");
const should = require("chai").should();

const Chalq = require("../lib/chalq");
const Task = require("../lib/task");

describe("Chalq", function () {
    beforeEach(function () {
        Chalq.destroy();
    });

    describe("initialize", function () {
        it("should initialize chalq with default params", function () {
            Chalq.initialize();

            Chalq.isReady().should.equal(true);
        });

        it("should fail to initialize twice", function () {
            Chalq.initialize();
            should.Throw(Chalq.initialize, "Chalq is already initialized");
        });
    });
    describe("registerTask", function () {
        beforeEach(function () {
            Chalq.initialize();
        });

        it("should register a task", function () {
            Chalq.registerTask("foo", Promise.resolve);
        });

        it("should throw if trying to register an already registered task", function () {
            Chalq.registerTask("foo", Promise.resolve);

            const partial = _.partial(Chalq.registerTask, "foo", Promise.resolve);

            should.Throw(partial, "A task with this name has already been registered");
        });

        it("should throw if passed handler is not a function", function () {
            const partial = _.partial(Chalq.registerTask, "foo", 5);

            should.Throw(partial, "Handler is not a function");
        });
    });

    describe("<task>.run", function () {
        beforeEach(function () {
            Chalq.initialize();
        });

        it("should run for a registered task", function (done) {
            Chalq.registerTask("foo", Promise.resolve);

            Chalq.foo.run([5]).then((task) => {
                task.should.be.instanceof(Task);
                done();
            }).catch(done);
        });
    });
});
