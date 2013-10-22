/**
 * Created by ftescht on 05.10.13.
 */

var RateHandler = exports.RateHandler = function (options) {
    this.doReset = false;
    this.interval = 1;
    this.inc = 1;
    this.rates = {};
    this.total = 0;
    this.keysCount = 0;
    this.lastChange = 0;

    this.getTime = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };
};

RateHandler.prototype.set = function (options) {
    if (options.interval != undefined && options.interval != null) {
        this.interval = options.interval;
    }
    if(options.msTime && this.interval) {
        this.getTime = function () {
            return (new Date()).getTime();
        };
        this.interval *= 1000;
    }

    this.doReset = options.doReset ? true : false;
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
        } else {
            this.keysCount++;
        }
        value = [t, v];
    } else {
        if (this.rates.hasOwnProperty(key)) {
            value = this.rates[key] + this.inc;
        } else {
            value = this.inc;
            this.keysCount++;
        }
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
        this.keysCount--;
        delete this.rates[key];
    }
};

RateHandler.prototype.resetAll = function () {
    this.rates = {};
    this.startTime = this.getTime();
    this.total = 0;
    this.keysCount = 0;
};

RateHandler.prototype.checkToReset = function (time) {
    if (this.doReset && this.interval && this.lastChange + this.interval < time) {
        this.resetAll();
    }
    this.lastChange = time;
};

RateHandler.prototype.getRate = function (key) {
    return this.rates[key] || 0;
};
