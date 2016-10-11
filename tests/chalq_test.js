const _ = require("lodash");
const os = require("os");
const rewire = require("rewire");
const should = require("chai").should();

const Chalq = rewire("../lib/chalq");
const Task = require("../lib/task");

describe("Chalq", function () {
    beforeEach(function () {
        Chalq.initialize();
    });

    afterEach(function () {
        Chalq.destroy();
    });

    describe("initialize", function () {
        beforeEach(function () {
            Chalq.destroy();
        });

        it("should initialize chalq with default params", function () {
            Chalq.initialize();

            Chalq.isReady().should.equal(true);
        });

        it("should fail to initialize twice", function () {
            Chalq.initialize();
            should.Throw(Chalq.initialize, "Chalq is already initialized");
        });

        it("should fail to initialize for an unknown broker", function () {
            should.Throw(() => {
                Chalq.initialize({
                    broker: {
                        name: "foo"
                    }
                });
            }, "Unknown broker type");
        });
    });
    describe("registerTask", function () {
        it("should throw if not initialized", function () {
            // Chalq is initialized automatically for all other tests, but we want an uninitialized
            // one.
            Chalq.destroy();

            should.Throw(() => {
                Chalq.registerTask("foo", Promise.resolve);
            }, "Chalq has not been initialized");
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

        it("should clear private events once task is finished", function (done) {
            const broker = Chalq.__get__("broker");

            Chalq.registerTask("foo", v => Promise.resolve(v));

            Chalq.foo.run([5]).then((task) => {
                task.should.be.instanceof(Task);
                task.on("success", () => {
                    ["success", "failed"].forEach((state) => {
                        broker.listenerCount(`${task.name}:${task.id}:${state}`).should.equal(0);
                    });
                    done();
                });

                Chalq.foo.startWorker();
            }).catch(done);
        });
    });

    describe("<task>.find", function () {
        it("should find a task for a registered task", function (done) {
            Chalq.registerTask("foo", Promise.resolve);

            const promises = _.times(5, n => Chalq.foo.run([n]));

            Promise.all(promises)
                .then((tasks) => {
                    const found = Chalq.foo.find(tasks[2].id);

                    found.id.should.equal(tasks[2].id);
                    should.not.exist(Chalq.foo.find("noop"));
                    done();
                })
                .catch(done);
        });
    });

    describe("<task>.<unknown_method>", function () {
        it("an unknown method should resolve to undefined", function () {
            Chalq.registerTask("foo", v => Promise.resolve(v));

            should.not.exist(Chalq.foo.qux);
        });
    });

    describe("<event_related_functions>", function () {
        it("should proxy event related functions", function (done) {
            Chalq.registerTask("foo", v => Promise.resolve(v));

            Chalq.on("foo:new", done);

            Chalq.foo.run([5]);
        });

        it("should throw if not initialized", function () {
            Chalq.destroy();

            should.Throw(() => {
                Chalq.on("foo:new", _.noop);
            }, "Chalq has not been initialized");
        });
    });

    describe("<task>.count", function () {
        it("should get tasks count for a registered task", function (done) {
            Chalq.registerTask("foo", Promise.resolve);

            const promises = _.times(6, n => Chalq.foo.run([n]));

            Promise.all(promises)
                .then(() => {
                    Chalq.foo.count().should.equal(6);
                })
                .then(done)
                .catch(done);
        });

        it("should be undefined for non defined tasks", function () {
            should.Throw(() => {
                Chalq.foo.count();
            }, "Cannot read property 'count' of undefined");
        });

        it("should clear private events once task is finished", function (done) {
            const broker = Chalq.__get__("broker");

            Chalq.registerTask("foo", v => Promise.resolve(v));

            Chalq.foo.run([5]).then((task) => {
                task.should.be.instanceof(Task);
                task.on("success", () => {
                    ["success", "failed"].forEach((state) => {
                        broker.listenerCount(`${task.name}:${task.id}:${state}`).should.equal(0);
                    });
                    done();
                });

                Chalq.foo.startWorker();
            }).catch(done);
        });
    });

    describe("runTask", function () {
        it("should throw when not initialized", function () {
            Chalq.destroy();

            should.Throw(() => {
                Chalq.runTask("foo", [5]);
            }, "Chalq has not been initialized");
        });
        it("should throw for an undefined task", function () {
            should.Throw(() => {
                Chalq.runTask("baz", [5]);
            }, "Task 'baz' is not defined");
        });
    });
});
