/**
 * Created by ftescht on 05.10.13.
 */

var RateHandler = exports.RateHandler = function (options) {
    this._increment = 1;
    this.rates = {};
    this.total = 0;
    this.keysCount = 0;

    if(options) this.set(options);
};

RateHandler.prototype.set = function (options) {
    this._increment = options.increment || 1;
};

RateHandler.prototype.increment = function (key) {
    var value = this._increment;

    if (this.rates.hasOwnProperty(key)) {
        value += this.rates[key];
    } else {
        this.keysCount++;
    }

    this.total += this._increment;
    this.rates[key] = value;

    return {
        key: key,
        value: value,
        total: this.total,
        keysCount: this.keysCount
    }
};

RateHandler.prototype.reset = function (key) {
    var value = this.rates[key];
    if (value) {
        this.total -= value;
        this.keysCount--;
        delete this.rates[key];
    }
};

RateHandler.prototype.resetAll = function () {
    this.rates = {};
    this.total = 0;
    this.keysCount = 0;
};

RateHandler.prototype.getRate = function (key) {
    return this.rates[key] || 0;
};
