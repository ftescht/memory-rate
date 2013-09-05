var sys = require('sys'),
    base = require('./base'),
    SimpleRateHandler = exports.SimpleRateHandler = function () {
        this.rates = {};
        this.total = 0;
    };

sys.inherits(SimpleRateHandler, base.BaseRateHandler);

SimpleRateHandler.prototype._increment_key = function (key, increment, options) {
    this.total += increment;
    this.rates[key] = this.rates[key] ? this.rates[key] + increment : increment;
    return {value: this.rates[key], ttl: 0, total: this.total};
};

SimpleRateHandler.prototype._reset_key = function (key) {
    if (this.rates[key]) {
        this.total -= this.rates[key];
        delete this.rates[key];
    }
};

SimpleRateHandler.prototype.resetAll = function () {
    this.total = 0;
    this.rates = {};
};

SimpleRateHandler.prototype.getRate = function (routeKey, remoteKey) {
    var fullKey = remoteKey ? routeKey+':'+remoteKey : routeKey;
    return this.rates[fullKey] || 0;
};
