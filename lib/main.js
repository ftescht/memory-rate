/**
 * Created by ftescht on 05.10.13.
 */

exports.Interval = require('./rate-interval');
exports.Unlim = require('./rate-unlim');
exports.Mini = require('./rate-min');

exports.defaults = function () {
    return {
        //handler: new exports.Interval.RateHandler(),
        msTime: true,
        setHeaders: true,
        doReset: false,
        interval: 1,
        increment: 1,
        limit: 0,
        total: 0,
        getKeys: function (req) {
            return [req.connection.remoteAddress];
        },
        onLimit: function (req, res, next, options, rate) {
            res.json({error: 'Rate limit exceeded. Check headers for limit information.'}, {status: 420});
        },
        onTotal: function (req, res, next, options, rate) {
            res.json({error: 'Rate total exceeded. Check headers for limit information.'}, {status: 420});
        },
        onSetHeaders: function (req, res, options, rate) {
            var value = options.interval
                    ? rate.value[1]
                    : rate.value,
                ttl = options.interval
                    ? rate.value[0]
                    : 0,
                remaining = options.limit - value;

            res.setHeader('X-RateLimit-Limit', options.limit);
            res.setHeader('X-RateLimit-Remaining', remaining >= 0 ? remaining : 0);
            if (ttl) res.setHeader('X-RateLimit-Reset', ttl);
        }
    };
};

exports.middleware = function (options0) {
    var options = options0 || {},
        defaults = exports.defaults();


    if(options.hasOwnProperty('handler')) {
        options.handler.set(options);
    } else {
        if(options.interval) {
            options.handler = new exports.Interval.RateHandler(options);
        } else {
            options.handler = new exports.Unlim.RateHandler(options);
        }
    }

    for(var pKey in defaults) {
        if (!options.hasOwnProperty(pKey)) {
            options[pKey] = defaults[pKey];
        }
    }

    return function (req, res, next) {
        var keys = options.getKeys(req);
        if (keys) {
            var i = keys.length - 1,
                toNext = true,
                rate, value;

            if (!(Object.prototype.toString.call(keys) === '[object Array]')) {
                keys = [keys];
                i = 0;
            }

            while (i >= 0) {
                rate = options.handler.increment(keys[i--]);
                value = options.interval ? rate.value[1] : rate.value;
                if (options.setHeaders) {
                    options.onSetHeaders(req, res, options, rate);
                }
                if (options.limit > 0 && value > options.limit) {
                    toNext = false;
                    options.onLimit(req, res, next, options, rate);
                }
                if (options.total > 0 && rate.total > options.total) {
                    toNext = false;
                    options.onTotal(req, res, next, options, rate);
                }
            }
        }
        if (toNext) next();
    }
};
