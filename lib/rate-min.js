/**
 * Created by ftescht on 05.10.13.
 */

var UIntMerge = function(firstValSize) {
    this.SV1 = firstValSize || 20;
    this.MV1 = (1 << this.SV1) - 1;
    this.MV2 = (1 << (32 - this.SV1)) - 1;
};
UIntMerge.prototype.merge = function (val1, val2) {
    return val2 << this.SV1 | val1;
};
UIntMerge.prototype.split = function (data) {
    return [data & this.MV1, data >> this.SV1 & this.MV2];
};


var RateHandler = exports.RateHandler = function (options) {
    this._doReset = false;
    this._interval = 1;
    this._increment = 1;
    this._startTime = 0;
    this._lastChange = 0;
    
    this.rates = {};
    this.total = 0;
    this.keysCount = 0;

    if(options) this.set(options);
};

RateHandler.prototype.intMerge = new UIntMerge(20);

RateHandler.prototype.getTime = function () {
    return Math.floor(Date.now() / 1000);
};

RateHandler.prototype.set = function (options) {
    this._interval = options.interval;
    this._increment = options.increment || 1;
    this._doReset = options.doReset ? true : false;
    this._startTime = this.getTime();
};


RateHandler.prototype.increment = function (key) {
    var now = this.getTime(),
        t = now + this._interval,
        v = this._increment,
        value;

    this.checkToReset(now);

    if (value = this.rates[key]) { value = this.intMerge.split(value);
        if (value[0] > (now - this._startTime)) {
            t = value[0];
            v += value[1];
        } else {
            this.total -= value[1];
        }
    } else {
        this.keysCount++;
    }

    this.total += this._increment;
    this.rates[key] = this.intMerge.merge(t, v);

    return {
        key: key,
        value: [t, v],
        total: this.total,
        keysCount: this.keysCount
    }
};

RateHandler.prototype.reset = function (key) {
    var value = this.rates[key];
    if (value && (value = this.intMerge.split(value)[1])) {
        this.total -= value;
        this.keysCount--;
        delete this.rates[key];
    }
};

RateHandler.prototype.resetAll = function () {
    this.rates = {};
    this.total = 0;
    this.keysCount = 0;
    this._startTime = this.getTime();
    this._lastChange = 0;
};

RateHandler.prototype.checkToReset = function (now) {
    if (this._doReset && this._lastChange + this._interval < now) {
        this.resetAll();
    }
    this._lastChange = now;
};

RateHandler.prototype.getRate = function (key) {
    var value = this.rates[key];
    if (value) {
        value = this.intMerge.split(value);
        value[0] += this._startTime;
    }
    return value;
};
