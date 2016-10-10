const _ = require("lodash");
const os = require("os");
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

    describe("<task>.startWorker", function () {
        beforeEach(function () {
            Chalq.initialize();
        });

        it("should start a worker for a registered task", function () {
            Chalq.registerTask("foo", Promise.resolve);

            const worker = Chalq.foo.startWorker();

            worker._processes.should.have.lengthOf(os.cpus().length);
            worker._processes.forEach(p => p.status().should.equal("started"));
        });

        it("should start a worker for a registered task with passed options", function () {
            Chalq.registerTask("foo", Promise.resolve);

            const worker = Chalq.foo.startWorker({ concurrency: 2 });

            worker._processes.should.have.lengthOf(2);
            worker._processes.forEach(p => p.status().should.equal("started"));
        });

        it("should throw for a non existant task", function () {
            should.Throw(() => {
                Chalq.foo.startWorker({ concurrency: 2 });
            }, "Cannot read property 'startWorker' of undefined");
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

        it("should emit success event when task is successful", function (done) {
            Chalq.registerTask("foo", v => Promise.resolve(v));


            Chalq.foo.run([5]).then((task) => {
                task.should.be.instanceof(Task);
                task.on("success", (result) => {
                    result.should.equal(5);
                    done();
                });

                Chalq.foo.startWorker();
            }).catch(done);
        });
    });
});
