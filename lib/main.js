/**
 * Created by ftescht on 05.10.13.
 */

exports.Normal = require('./rate');
exports.Mini = require('./ratemin');

exports.defaults = function () {
    return {
        handler: new exports.Normal.RateHandler(),
        setHeaders: true,
        doReset: false,
        interval: 1,
        increment: 1,
        limit: 0,
        total: 0,
        getKeys: function (req) {
            return [req.connection.remoteAddress];
        },
        onLimit: function (req, res, next, rate) {
            res.json({error: 'Rate limit exceeded. Check headers for limit information.'}, {status: 420});
        },
        onTotal: function (req, res, next, rate) {
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

exports.middleware = function (options) {
    options = options || {};

    var defaults = exports.defaults(),
        defKeys = Object.keys(defaults),
        i = defKeys.length - 1, pKey = null;

    while (i >= 0) {
        pKey = defKeys[i--];
        if (!options.hasOwnProperty(pKey)) {
            options[pKey] = defaults[pKey]
        }
    }
    defaults = null;
    pKey = null;
    defKeys = null;

    options.handler.set(options);

    return function (req, res, next) {
        var keys = options.getKeys(req);
        if (keys) {
            var i = keys.length - 1, toNext = true, rate = null, value = null;

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
                    options.onLimit(req, res, next, rate);
                }
                if (options.total > 0 && rate.total > options.total) {
                    toNext = false;
                    options.onTotal(req, res, next, rate);
                }
            }
        }
        if (toNext) next();
    }
};
