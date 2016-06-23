var log = require('logger')('clustor');
var cluster = require('cluster');
var os = require('os');

module.exports = function (run) {
    if (cluster.isWorker) {
        return run();
    }
    var i;
    var cpus = os.cpus().length;
    for (i = 0; i < cpus; i++) {
        cluster.fork();
    }
    cluster.on('exit', function (worker, code, signal) {
        log.debug('worker stopped pid:%s, signal:%s, code:%s', worker.process.pid, signal, code);
        cluster.fork();
    });
};
