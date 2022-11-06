import { processConfig } from '../catalyst/catalyst.js';
import { $ } from '../catalyst/enode';

processConfig();

// ------- Context

var rule = window.evolv.renderRule.exp;
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
        asClass: 'HEADING',
    },
});

rule.instrument.add([
    ['images', 'img'],
    ['buttons', () => $('button')],
    ['h2', 'h2'],
]);

rule.whenElement('.badger').then((badger) => log('FOUND THE BADGER', badger));

rule.whenItem('h2').then((h2) => log('WHENITEM: FOUND H2', h2));

rule.whenDOM('p').then((p) => log('WHENDOM: p', p));

rule.waitUntil(() => window.vzdl.page.name).then((pageName) =>
    log('WAITUNTIL: pageName', pageName)
);

rule.waitUntil(() => window.y, 5000).then((y) => log('WAITUNTIL y:', y));
