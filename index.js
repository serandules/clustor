var log = require('logger')('clustor');
var cluster = require('cluster');

var cpus = require('os').cpus().length;

module.exports = function (domain, run, done, forks) {
    if (typeof done !== 'function') {
        forks = done;
        done = null;
    }
    if (cluster.isWorker) {
        return run();
    }
    forks = forks || cpus;
    var i;
    for (i = 0; i < forks; i++) {
        cluster.fork();
    }
    cluster.on('exit', function (worker, code, signal) {
        if (log.debug) {
            log.debug('%s worker %s stopped (%s)', domain, worker.process.pid, signal || code);
            log.debug('%s worker restarting', domain);
        }
        cluster.fork();
    });
    cluster.on('listening', function (worker, address) {
        if (log.debug) {
            log.debug('worker started');
        }
        if (--forks > 0) {
            return;
        }
        if (log.debug) {
            log.debug('all workers started');
        }
        done(false, address);
    });
};

/*
process.on('uncaughtException', function (err) {
    log.fatal('unhandled exception %s', err);
    log.trace(err.stack);
});*/
