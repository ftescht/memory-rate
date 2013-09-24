exports.RateHandler = require('./rate');

exports.defaults = function () {
    return {
        handler: new exports.RateHandler.RateHandler(),
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
        if(!options[pKey]) {
            options[pKey] = defaults[pKey]
        }
    }

    defaults = null;
    pKey = null;
    defKeys = null;

    return function (req, res, next) {
        var keys = options.getKeys(req);
        if(keys) {
            var i = keys.length-1, toNext = true, rate = null;

            if(!(Object.prototype.toString.call(keys) === '[object Array]')) {
                keys = [keys];
                i = 0;
            }

            while (i>=0) {
                rate = options.handler.increment(keys[i--]);
                if (options.limit > 0 && rate.value > options.limit) {
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
