import { processConfig } from '../catalyst/catalyst.js';

processConfig();

// ------- Context

var rule = window.evolv.renderRule.exp;
var $ = rule.$;
var $$ = rule.$$;
var store = rule.store;
var log = rule.log;

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

rule.whenDOM('.badger').then((badger) => log('FOUND THE BADGER', badger));
