/**
 * Created by ftescht on 05.10.13.
 */

function UIntMerge(firstValSize) {
    var SV1 = firstValSize || 20,
        MV1 = (1 << SV1) - 1,
        MV2 = (1 << (32 - SV1)) - 1;
    return {
        merge: function (val1, val2) {
            return val2 << SV1 | val1;
        },
        split: function (data) {
            return [data & MV1, data >> SV1 & MV2];
        }
    }
}

var RateHandler = exports.RateHandler = function () {
    this.intMerge = UIntMerge(20);
    this.doReset = false;
    this.interval = 1;
    this.inc = 1;
    this.rates = {};
    this.total = 0;

    this.startTime = 0;
    this.lastChange = 0;

    this.getTime = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };
};

RateHandler.prototype.set = function (options) {
    if (options.interval != undefined && options.interval != null) {
        this.interval = options.interval;
    }
    this.doReset = options.doReset ? true : false;
    this.inc = options.increment || 1;
    this.startTime = this.getTime();
};


RateHandler.prototype.increment = function (key) {
    var value = 0, time = this.getTime();
    this.checkToReset(time);
    if (this.interval) {
        var t = (time - this.startTime) + this.interval,
            v = this.inc;
        if (this.rates.hasOwnProperty(key)) {
            value = this.intMerge.split(this.rates[key]);
            if (value[0] > (time - this.startTime)) {
                t = value[0];
                v += value[1];
            } else {
                this.total -= value[1];
            }
        }
        this.rates[key] = this.intMerge.merge(t, v);
        value = [t, v];
    } else {
        value = (this.rates[key] || 0) + this.inc;
        this.rates[key] = value;
    }
    this.total += this.inc;

    return { key: key, value: value, total: this.total};
};

RateHandler.prototype.reset = function (key) {
    var value = this.rates[key];
    if (value) {
        if (this.interval) {
            value = this.intMerge.split(value)[1];
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
    if (this.doReset && this.interval && this.lastChange + this.interval < time) {
        this.resetAll();
    }
    this.lastChange = time;
};

RateHandler.prototype.getRate = function (key) {
    var value = this.rates[key] || 0;
    if (this.interval && value) {
        value = this.intMerge.split(value);
        value[0] += this.startTime;
    }
    return value;
};
