const Benchmark = require("benchmark");
const Chalq = require("./dist/chalq.js");

function runBenchmark() {
    const bench = new Benchmark("Chalq#registerTask", {
        defer: true,
        fn: function (deferred) {
            Chalq.sum_eventually.run([5, 5]).then(() => {
                deferred.resolve();
            });
        }
    });

    bench.on("cycle", function(event) {
        console.log(String(event.target));
    });

    bench.on("complete", function() {
        console.log("Completed: ", this.stats);
        process.exit();
    });

    bench.run();
}

Chalq.initialize({ broker: { name: "memory" } });


function registerTask() {
    Chalq.registerTask("sum_eventually", (a, b) => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(a + b), 100);
        });
    });

    return Promise.resolve();
}

Chalq.once("ready", () => registerTask().then(runBenchmark));
console.log("Here");
