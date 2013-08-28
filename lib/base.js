var BaseRateHandler = exports.BaseRateHandler = function () {};

BaseRateHandler.prototype.increment = function (routeKey, remoteKey, options) {
    var rate = this._increment_key(routeKey, 1, options);
    if(remoteKey)
        rate = this._increment_key(routeKey + ':' + remoteKey, 1, options);
    return rate;
};

BaseRateHandler.prototype.reset = function (routeKey, remoteKey, next, callback) {
    this._reset_key(routeKey);
    if(remoteKey)
        this._reset_key(routeKey + ':' + remoteKey);
};

BaseRateHandler.prototype.clear = false;
