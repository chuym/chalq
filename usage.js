const Chalq = require("./dist/chalq.js");

function registerTask() {
    Chalq.registerTask("sum_eventually", (a, b) => {
        return new Promise((resolve) => {
            console.log("Running...", a, b);
            setTimeout(() => resolve(a + b), 10);
        });
    });

    return Promise.resolve();
}

function startWorker() {
    Chalq.sum_eventually.startWorker({
        concurrency: 8
    });

    return Promise.resolve();
}

function runTests() {
    for (let i = 0; i < 1000; i++) {
        Chalq.sum_eventually.run([i, i]).then((task) => {
            console.log("Summing eventually");
            task.once("success", (result) => {
                console.log(result);
            });
        }).catch((e) => console.log(e));
    }
}

Chalq.initialize({ broker: { name: "rabbitmq" } });

Chalq.once("ready", () => registerTask().then(runTests));
