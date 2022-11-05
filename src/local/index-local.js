import { processConfig } from '../catalyst/catalyst.js';

processConfig();

// ------- Context

var rule = window.evolv.renderRule.exp;
var $ = rule.$;
var $$ = rule.$$;
var store = rule.store;

store.instrumentDOM({
    body: {
        get dom() {
            return $('body');
        },
    },
    heading: {
        get dom() {
            return $('h1');
        },
    },
});
