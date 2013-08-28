exports.Base = require('./base');
exports.Memory = require('./memory');
exports.Simple = require('./simple');

// 
// DEFAULTS FOR OPTIONS
// extensibility point
//
exports.defaults = function () {
    return {
        handler: new exports.Memory.MemoryRateHandler(),
        interval: 1,
        limit: 0,
        total: 0,
        clearInterval: 100,
        setHeaders: true,
        getRemoteKey: function (req) {
            return req.connection.remoteAddress;
        },
        getRouteKey: function (req) {
            return req.route.method + ':' + req.route.regexp;
        },
        setHeadersHandler: function (req, res, rate, limit, resetTime) {
            var remaining = limit - rate;
            if (remaining < 0) remaining = 0;

            res.setHeader('X-RateLimit-Limit', limit);
            res.setHeader('X-RateLimit-Remaining', remaining);
            res.setHeader('X-RateLimit-Reset', resetTime);
        },
        onLimitReached: function (req, res, rate, limit, resetTime, next) {
            res.json({error: 'Rate limit exceeded. Check headers for limit information.'}, {status: 420});
        },
        onTotalReached: function (req, res, rateTotal, total, resetTime, next) {
            res.json({error: 'Rate total limit exceeded. Check headers for limit information.'}, {status: 420});
        }
    };
};

//
// MIDDLEWARE
//
exports.middleware = function countRate(options) {
    var defaults = exports.defaults();
    options = options || {};
    for (var prop in defaults) {
        if (options[prop] == null) options[prop] = defaults[prop];
    }

    return function recordRate(req, res, next) {
        var routeKey = options.getRouteKey(req),
            remoteKey = options.getRemoteKey(req),
            toNext = true,
            rate = options.handler.increment(routeKey, remoteKey, options);

        if (options.setHeaders) {
            options.setHeadersHandler(req, res, rate.value, options.limit, rate.ttl);
        }
        if (options.total > 0 && rate.total > options.total) {
            toNext = false;
            options.onTotalReached(req, res, rate.total, options.total, rate.ttl, next);
        }
        if (options.limit > 0 && rate.value > options.limit) {
            toNext = false;
            options.onLimitReached(req, res, rate.value, options.limit, rate.ttl, next);
        }

        if (toNext) {
            if(options.handler.clear && rate.total % options.clearInterval == 0) {
                options.handler.clear();
            }
            next();
        }
    }
};
