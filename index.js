var log = require('logger')('clustor');
var cluster = require('cluster');
var procevent = require('procevent');

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
    var address;
    var listening = forks;
    var starting = forks;
    var i;
    for (i = 0; i < listening; i++) {
        (function () {
            var worker = cluster.fork();
            var pevent = procevent(worker.process);
            pevent.once('started', function () {
                log.debug('worker started');
                pevent.destroy();
                if (--starting > 0) {
                    return;
                }
                log.debug('all workers started');
                var master = procevent(process);
                master.emit('started', process.pid, address.port);
                master.destroy();
                log.debug(JSON.stringify(address));
                done(false, address);
            });
        }());
    }
    cluster.on('exit', function (worker, code, signal) {
        log.debug('worker stopped | domain:%s, pid:%s, signal:%s, code:%s', domain, worker.process.pid, signal, code);
        //log.debug('%s worker restarting', domain);
        //cluster.fork();
    });
    cluster.on('listening', function (worker, addrezz) {
        log.debug('worker listening');
        if (--listening > 0) {
            return;
        }
        address = addrezz;
        log.debug('all workers listening');
    });
};
