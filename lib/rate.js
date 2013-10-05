/**
 * Created by ftescht on 05.10.13.
 */

var RateHandler = exports.RateHandler = function (options) {
    this.interval = 1;
    this.inc = 1;
    this.rates = {};
    this.total = 0;
    this.lastChange = 0;
};

RateHandler.prototype.getTime = function () {
    return Math.round(new Date().getTime() / 1000.0);
};

RateHandler.prototype.set = function (options) {
    if (options.interval != undefined && options.interval != null) {
        this.interval = options.interval;
    }
    this.inc = options.increment || 1;
};

RateHandler.prototype.increment = function (key) {
    var value = 0, time = this.getTime();
    this.checkToReset(time);
    if (this.interval) {
        var t = time + this.interval,
            v = this.inc;
        if (this.rates.hasOwnProperty(key)) {
            value = this.rates[key];
            if (value[0] > time) {
                t = value[0];
                v += value[1];
            } else {
                this.total -= value[1];
            }
        }
        value = [t, v];
    } else {
        value = (this.rates[key] || 0) + this.inc;
    }

    this.total += this.inc;
    this.rates[key] = value;

    return { key: key, value: value, total: this.total};
};

RateHandler.prototype.reset = function (key) {
    var value = this.rates[key];
    if (value) {
        if (this.interval) {
            value = value[1];
        }
        this.total -= value;
        delete this.rates[key];
    }
};

RateHandler.prototype.resetAll = function () {
    this.rates = {};
    this.startTime = this.getTime();
    this.total = 0;
};

RateHandler.prototype.checkToReset = function (time) {
    if (this.interval && this.lastChange + this.interval < time) {
        this.resetAll();
    }
    this.lastChange = time;
};

RateHandler.prototype.getRate = function (key) {
    return this.rates[key] || 0;
};
