/*
var cfs = new CloudFS('qiniu');

// e.g 1
cfs.upload(data, {
    'progress': function() {}
    ,'success': function() {}
    ,'error': function() {}
    ,'always': function() {}
});

// e.g 2
cfs
    .upload(data)
    .progress(function() {})
    .success(function() {})
    .error(function() {})
    .always(function() {})
;
*/
define('cloudfs', ['jquery'], function($) {

    var upload = function(data, config, handler) {

        var that = this;

        var form = new FormData();
        for (var k in data) {
            form.append(k, data[k]);
        }

        if ($.isPlainObject(config.params)) {
            for (var k in config.params) {
                form.append(k, config.params[k]);
            }
        }

        form.append('cfs:cloud', that.cloud);

        var xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', function(evt) {
            var info = false;
            if (evt.lengthComputable) {
                info = {
                    total: evt.total
                    ,percent: Math.round(evt.loaded * 100 / evt.total)
                };
            }
            handler.progress && handler.progress(info);
        }, false);

        xhr.addEventListener('load', function(evt) {
            var status = evt.target.status;
            if (status==200) {
                var data = JSON.parse(xhr.responseText);
                if (config.callback) {
                    $.post(config.callback, {cloud: that.cloud, data: data}, function(data) {
                        handler.success && handler.success(data);
                        handler.always && handler.always(evt);
                    });
                }
                else {
                    handler.success && handler.success(data);
                    handler.always && handler.always(evt);
                }
            }
        }, false);

        xhr.addEventListener('error', function(evt) {
            handler.error && handler.error(evt);
            handler.always && handler.always(evt);
        }, false);

        xhr.addEventListener('abort', function(evt) {
            handler.abort && handler.abort();
            handler.always && handler.always(evt);
        }, false);

        xhr.open('POST', config.url);
        xhr.send(form);

    };

    var CloudFS = function(cloud) {
        this.configURL = '/ajax/cloudfs/getConfig';
        this.cloud = cloud || '';
        this.handlers = {};
    };

    CloudFS.prototype.upload = function(data, handler) {
        var that = this;
        $.get(this.configURL, {
            cloud: this.cloud
        }, function(config) {
            var mHandlers = handler || {};
            var rHandlers = $.extend(mHandlers, that.handlers);
            upload.call(that, data, config || {}, rHandlers);
        });

        return this;
    };

    CloudFS.prototype.progress = function(method) {
        this.handlers.progress = method;
    };

    CloudFS.prototype.abort = function(method) {
        this.handlers.abort = method;
    };

    CloudFS.prototype.error = function(method) {
        this.handlers.error = method;
    };

    CloudFS.prototype.success = function(method) {
        this.handlers.success = method;
    };

    CloudFS.prototype.always = function(method) {
        this.handlers.always= method;
    };

    return CloudFS;

});
