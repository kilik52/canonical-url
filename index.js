/**
 * Created by zhuxichi on 16/8/30.
 */

'use strict';
var url = require('url');
var punycode = require('punycode');
const queryString = require('qs');
var prependHttp = require('prepend-http');
var sortKeys = require('sort-keys');
var objectAssign = require('object-assign');

var DEFAULT_PORTS = {
    'http:': 80,
    'https:': 443,
    'ftp:': 21
};

// protocols that always contain a `//`` bit
var slashedProtocol = {
    'http': true,
    'https': true,
    'ftp': true,
    'gopher': true,
    'file': true,
    'http:': true,
    'https:': true,
    'ftp:': true,
    'gopher:': true,
    'file:': true
};

function testQueryParameter(name, filters) {
    return filters.some(function (filter) {
        return filter instanceof RegExp ? filter.test(name) : filter === name;
    });
}

module.exports = function (str, opts) {
    opts = objectAssign({
        normalizeProtocol: true,
        stripFragment: false,
        stripWWW: true,
        removeQueryParameters: [/^utm_\w+/i, /^shaozi_\w+/i],
        removeTrailingSlash: true
    }, opts);

    if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
    }

    var hasRelativeProtocol = str.indexOf('//') === 0;

    // prepend protocol
    str = prependHttp(str.trim()).replace(/^\/\//, 'http://');

    var urlObj = url.parse(str);

    if (!urlObj.hostname && !urlObj.pathname) {
        throw new Error('Invalid URL');
    }

    // prevent these from being used by `url.format`
    delete urlObj.host;
    delete urlObj.query;

    // remove fragment
    if (opts.stripFragment) {
        delete urlObj.hash;
    }

    // remove default port
    var port = DEFAULT_PORTS[urlObj.protocol];
    if (Number(urlObj.port) === port) {
        delete urlObj.port;
    }

    // remove duplicate slashes
    if (urlObj.pathname) {
        urlObj.pathname = urlObj.pathname.replace(/\/{2,}/, '/');
    }

    // resolve relative paths, but only for slashed protocols
    if (slashedProtocol[urlObj.protocol]) {
        var domain = urlObj.protocol + '//' + urlObj.hostname;
        var relative = url.resolve(domain, urlObj.pathname);
        urlObj.pathname = relative.replace(domain, '');
    }

    // treat https the same as http
    if (urlObj.protocol == "https:") {
        urlObj.protocol = "http:";
    }

    if (urlObj.hostname) {
        // IDN to Unicode
        urlObj.hostname = punycode.toUnicode(urlObj.hostname).toLowerCase();

        // remove trailing dot
        urlObj.hostname = urlObj.hostname.replace(/\.$/, '');

        // remove `www.`
        if (opts.stripWWW) {
            urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
        }
    }

    // remove URL with empty query string
    if (urlObj.search === '?') {
        delete urlObj.search;
    }

    if (urlObj.search && urlObj.search.indexOf('?') == 0) { // remove ?
        urlObj.search = urlObj.search.slice(1, urlObj.search.length);
    }

    //parse query string, do not decode
    var queryParameters = queryString.parse(urlObj.search, {
        plainObjects: true,
        decoder: function (str) {
            return str;
        }
    });

    // remove query unwanted parameters
    if (Array.isArray(opts.removeQueryParameters)) {
        for (var key in queryParameters) {
            if (testQueryParameter(key, opts.removeQueryParameters)) {
                delete queryParameters[key];
            }
        }
    }

    // sort query parameters, do not encode
    urlObj.search = queryString.stringify(sortKeys(queryParameters), {
        encoder: function (str) {
            return str;
        }
    });

    // don't decode query parameters, because there're chinese characters or BG2312 characters
    //urlObj.search = decodeURIComponent(urlObj.search);

    // take advantage of many of the Node `url` normalizations
    str = url.format(urlObj);

    // remove ending `/`
    if (opts.removeTrailingSlash || urlObj.pathname === '/') {
        str = str.replace(/\/$/, '');
    }

    // restore relative protocol, if applicable
    if (hasRelativeProtocol && !opts.normalizeProtocol) {
        str = str.replace(/^http:\/\//, '//');
    }

    return str;
};
