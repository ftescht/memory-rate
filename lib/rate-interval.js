/**
 * Created by ftescht on 05.10.13.
 */

var RateHandler = exports.RateHandler = function (options) {
    this._interval = 1;
    this._increment = 1;
    this._doReset = false;
    this._lastChange = 0;

    this.rates = {};
    this.total = 0;
    this.keysCount = 0;

    this.getTime = function () {
        return Math.floor(Date.now() / 1000);
    };

    if(options) this.set(options);
};

RateHandler.prototype.set = function (options) {
    this._doReset = options.doReset ? true : false;
    this._increment = options.increment || 1;
    this._interval = options.interval;

    if(options.msTime && this._interval) {
        this.getTime = Date.now;
        this._interval *= 1000;
    }
};

RateHandler.prototype.increment = function (key) {
    var now = this.getTime(),
        t = now + this._interval,
        v = this._increment,
        value;
    
    this.checkToReset(now);

    if (value = this.rates[key]) {
        if (value[0] > now) {
            t = value[0];
            v += value[1];
        } else {
            this.total -= value[1];
        }
    } else {
        this.keysCount++;
    }

    value = [t, v];
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
        this.total -= value[1];
        this.keysCount--;
        delete this.rates[key];
    }
};

RateHandler.prototype.resetAll = function () {
    this.rates = {};
    this.total = 0;
    this.keysCount = 0;
    this._lastChange = 0;
};

RateHandler.prototype.checkToReset = function (now) {
    if (this._doReset && this._lastChange + this._interval < now) {
        this.resetAll();
    }
    this._lastChange = now;
};

RateHandler.prototype.getRate = function (key) {
    return this.rates[key] || 0;
};
