
/**
 * Module dependencies.
 */

var connect = require('connect'),
    helpers = require('./helpers'),
    assert = require('assert'),
    http = require('http');

// Stores

var MemoryStore = require('connect/filters/session/memory').MemoryStore;
var CookieStore = require('connect/filters/session/cookie').CookieStore;

module.exports = {
    'test MemoryStore': function(){
        var n = 0, sid;

        var server = helpers.run([
            { filter: 'cookie' },
            { filter: 'session', store: new MemoryStore({ reapInterval: -1 }) },
            { filter: 'flash' },
            { module: {
                handle: function(req, res, next){
                    switch (n++) {
                        case 0:
                            assert.eql({}, req.flash());
                            assert.eql([], req.flash('info'));
                            req.flash('info', 'email sending');
                            assert.equal(2, req.flash('info', 'email sent successfully'));
                            break;
                        case 1:
                            assert.eql(['email sending', 'email sent successfully'], req.flash('info'));
                            assert.eql([], req.flash('info'));
                            break;
                        case 2:
                            assert.eql([], req.flash('info'));
                            req.flash('error', 'email failed');
                            req.flash('info', 'email re-sent');
                            break;
                        case 3:
                            assert.eql({ info: ['email re-sent'], error: ['email failed'] }, req.flash());
                            assert.eql({ }, req.flash());
                            break;
                    }
                    next();
                }
            }}
        ]);
        
        server.pending = 4;
        var req = server.request('GET', '/');
        req.addListener('response', function(res){
            var setCookie = res.headers['set-cookie'];
            sid = setCookie.match(/connect\.sid=([^;]+)/)[1];
            res.addListener('end', function(){
                server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid }).end();
                server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid }).end();
                server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid }).end();
            });
        });
        req.end();
    }
};