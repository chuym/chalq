# Chalq

[![build status](https://gitlab.com/xdc/chalq/badges/master/build.svg)](https://gitlab.com/xdc/chalq/commits/master) [![coverage report](https://gitlab.com/xdc/chalq/badges/master/coverage.svg)](https://gitlab.com/xdc/chalq/commits/master)

A work queue with flexible backends.

## Install

Currently not registered in npm. You'll need to explicitly set this repository as source in your `package.json` file.
e.g.

``` json
{
    "dependencies": {
        "chalq": "https://gitlab.com/xdc/chalq.git#master"
    }
}
```

## Usage

``` javascript
const Chalq = require("chalq");

Chalq.initialize(); // Will use the Memory broker by default

// Task handlers must return a Promise to ensure correct behavior.
Chalq.registerTask("my_task", (a, b) => {
    return new Promise((resolve) => resolve(a + b));
});

// Arguments must be passed inside an Array
const task = Chalq.my_task.run([1, 2]);

// If the task handler fulfills the task promise, it will fire this event.
task.on("complete", function (result) {
    console.log(result) // 3
});

// This event will fire if the handler rejects the promise.
task.on('failed', function (err) {
    console.log(err); // Failure reason
});

// To find out how many tasks are currently enqueued
Chalq.my_task.count(); // The number of enqueued tasks.

// To find a particular task you can call the `find` function.
// Note that the find operation can be intensive depending the backend broker used. In some cases
// it might do a full search rather than a indexed search.
Chalq.my_task.find('<my_task_id>');
```

## Change log

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Testing

``` bash
$ npm test
```

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md)

## Credits

- Xavier Del Castillo <xavier@xdc.im>
- [Contributors](https://gitlab.com/xdc/chalq/graphs/master)

## License

The new BSD License (BSD-3). Please see [License File](LICENSE) for more information.
