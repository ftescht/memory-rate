var sys = require('sys'),
    base = require('./base'),
    MemoryRateHandler = exports.MemoryRateHandler = function () {
        this.rates = {};
        this.total = 0;
    };

// inherit from the base rate handler
sys.inherits(MemoryRateHandler, base.BaseRateHandler);

MemoryRateHandler.prototype._increment_key = function (key, increment, options) {
    var remakeKey = true,
        currentTime = Date.now(),
        ttl = currentTime,
        rate = increment;

    if (this.rates[key]) {
        var rateInfo = this.rates[key];
        if (currentTime < rateInfo.ttl) {
            remakeKey = false;
            rateInfo.value += increment;
            this.total += increment;
            rate = rateInfo.value;
            ttl = rateInfo.ttl;
        } else {
            this.total -= rateInfo.value;
        }
        rateInfo = null;
    }
    if (remakeKey) {
        ttl = currentTime + (options.interval * 1000);
        this.rates[key] = {value: increment, ttl: ttl};
        this.total += increment;
    }

    return {value: rate, ttl: ttl, total: this.total};
};

MemoryRateHandler.prototype._reset_key = function (key) {
    if (this.rates[key]) {
        this.total -= this.rates[key].value;
        delete this.rates[key];
    }
};

MemoryRateHandler.prototype.getRate = function (routeKey, remoteKey) {
    var fullKey = remoteKey ? routeKey+':'+remoteKey : routeKey;
    return this.rates[fullKey] ? this.rates[fullKey].value : 0;
};

MemoryRateHandler.prototype.clear = function () {
    var keys = Object.keys(this.rates),
        i = keys.length - 1,
        counter = 0;
    for(;i>=0;i--) {
        var k = keys[i],
            r = this.rates[k];
        if (r && r.ttl < Date.now()) {
            this.total -= r.value;
            delete this.rates[k];
            counter++;
        }
    }
    keys = null;
    return counter;
};
