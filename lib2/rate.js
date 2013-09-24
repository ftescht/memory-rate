var RateHandler = exports.RateHandler = function (options) {
    this.interval = options.interval || 0;
    this.increment = options.increment || 1;
    this.rates = {};
    this.ttl = {};
    this.total = 0;
    this.lastChange = 0;
};

RateHandler.prototype.increment = function (key) {
    this.checkToReset();
    var value = 0;
    if (this.interval) {
        value = this.rates[key];
        if (value && value.t < Date.now()) {
            value.v += this.increment;
        } else {
            if(value) this.total -= value.v;
            value = {v: this.increment, t: Date.now() + this.interval};
        }
        this.rates[key] = value;
        value = value.v;
    } else {
        value = (this.rates[key] || 0) + this.increment;
        this.rates[key] = value;
    }

    this.total += this.increment;
    return { key: key, value: value, total: this.total};
};

RateHandler.prototype.reset = function (key) {
    var value = this.rates[key];
    if (value) {
        if (this.interval) {
            value = value.v;
        }
        this.total -= value;
        delete this.rates[key];
    }
};

RateHandler.prototype.resetAll = function () {
    this.rates = {};
    this.total = 0;
};

RateHandler.prototype.checkToReset = function () {
    if(this.interval && this.lastChange < (Date.now() + this.interval)) {
        this.resetAll();
    }
    this.lastChange = Date.now();
};

RateHandler.prototype.getRate = function (key) {
    return this.rates[key] || 0;
};
