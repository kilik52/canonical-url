/**
 * Created by zhuxichi on 16/8/30.
 */
var chai = require('chai');
var should = chai.should();
var canonicalUrl = require('../index');
chai.use(require('chai-string'));

describe('Test', function () {
    it("should add http protocol to website", function (done) {
        var result = canonicalUrl("shaozi.info");
        result.should.equal("http://shaozi.info");
        done();
    });

    it("should remove default ports", function (done) {
        var result = canonicalUrl("shaozi.info:80");
        result.should.equal("http://shaozi.info");
        done();
    });

    it("should remove default ports", function (done) {
        var result = canonicalUrl("https://shaozi.info:443");
        result.should.equal("http://shaozi.info");
        done();
    });

    it("should add convert http to https(in order to compare)", function (done) {
        var result = canonicalUrl("https://shaozi.info");
        result.should.equal("http://shaozi.info");
        done();
    });

    it("should ignore any utm queries", function (done) {
        var result = canonicalUrl("https://shaozi.info/links?utm_source=a&utm_medium=b&a=c");
        result.should.equal("http://shaozi.info/links?a=c");
        done();
    });

    it("should ignore any shaozi_ queries", function (done) {
        var result = canonicalUrl("https://shaozi.info/links?utm_source=a&utm_medium=b&a=c&shaozi_user=jfeiwnvow");
        result.should.equal("http://shaozi.info/links?a=c");
        done();
    });

    it("should support percentage escaped urls", function (done) {
        var result = canonicalUrl("https://shaozi.info/search?q=%e5%95%a6%e5%95%a6%20%e5%95%a6&a=c");
        result.should.equalIgnoreCase("http://shaozi.info/search?a=c&q=%e5%95%a6%e5%95%a6%20%e5%95%a6");
        done();
    });

    it("should support AngularJS sites", function (done) {
        var result = canonicalUrl("https://www.angularjs.site/#/list?a=q");
        result.should.equal("http://angularjs.site/#/list?a=q");
        done();
    });

    it("should support chinese domain", function (done) {
        var result = canonicalUrl("https://ddd.中国");
        result.should.equal("http://ddd.中国");
        done();
    });

    it("should strip WWW", function (done) {
        var result = canonicalUrl("https://www.ddd.中国");
        result.should.equal("http://ddd.中国");
        done();
    });

    it("should support GB2312 percentage escaped urls", function (done) {
        var result = canonicalUrl("https://shaozi.info/search?q=%c0%b2%c0%b2%c0%b2&a=c");
        result.should.equalIgnoreCase("http://shaozi.info/search?a=c&q=%c0%b2%c0%b2%c0%b2");
        done();
    });
});