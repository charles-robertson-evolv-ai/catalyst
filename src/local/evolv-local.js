import { processConfig } from '../catalyst/catalyst.js';
// import { $ } from '../catalyst/enode';

processConfig();

// ------- Context

var rule = window.evolv.renderRule.xhs;
// rule.id = 'fg70f47y0';
var $ = rule.$;
var $$ = rule.$$;
var store = rule.store;

rule.perf = performance.now();

function extendRule(rule) {
    var ENode = rule.$().constructor;

    ENode.prototype.exists = function () {
        return this.el.length > 0 && this.el[0] !== null;
    };

    ENode.prototype.hasClass = function (className) {
        const el = this.firstDom();
        if (!el) return false;
        return this.firstDom().classList.contains(className);
    };

    ENode.prototype.regExContains = function (regex) {
        var el = this.el;
        return new ENode(
            el.filter(function (e) {
                return regex.test(e.textContent);
            })
        );
    };
}

// if (this && this.key) {
//     rule.key = this.key;
// } else {
//     rule.isActive = () => {
//         return window.location.href.includes(
//             'https://www.verizon.com/sales/next/expresscheckout.html'
//         );
//     };
// }

rule.key = 'xhs2';

function instrumentPage() {
    store.instrumentDOM({
        body: {
            get dom() {
                return $('body');
            },
        },
        page: {
            get dom() {
                return $('#page');
            },
        },
        heading: {
            get dom() {
                return $(
                    '#page div[data-testid="expressCheckoutContent"] h1'
                ).parent();
            },
        },
        'content-wrap': {
            get dom() {
                return $('#page .linePad').parent().parent();
            },
        },
        'line-pad': {
            get dom() {
                return $('#page .linePad');
            },
        },
        'product-list': {
            get dom() {
                return $(
                    '#page .linePad div[data-testid^="product-dev"], #page .linePad div[data-testid^="accessory-item-"]'
                )
                    .first()
                    .parent();
            },
        },
        'product-list-wrap': {
            get dom() {
                return $$('product-list').parent();
            },
        },
        'device-item': {
            get dom() {
                return $('#page .linePad div[data-testid^="product-dev"]');
            },
        },
        'trade-in-section': {
            get dom() {
                return $('[data-testid="expressCheckoutTradeinIndex"]');
            },
        },
        'promo-connected': {
            get dom() {
                return $('#page div[data-testid="connected-devices"]');
            },
        },
        'promo-bogo': {
            get dom() {
                return $('#page div[data-testid="bogo-upsell-container"]');
            },
        },
        'promo-home': {
            get dom() {
                return $(
                    $$('product-list-wrap')
                        .find('p')
                        .contains('Verizon Home Device Protect')
                        .parent()
                        .parent()
                        .parent()
                        .el.filter((element) => element.querySelector('button'))
                );
            },
        },
        'promo-get-more': {
            get dom() {
                return $('#page .linePad .descWidth').parent().parent();
            },
        },
        'accessory-item': {
            get dom() {
                // Gets all the accessory items that are not in the accessory interstitial
                return $(
                    $(
                        '#page .linePad div[data-testid^="accessory-item-"]'
                    ).el.filter(
                        (item) =>
                            item.closest('.accessory-interstitial') === null
                    )
                );
            },
        },
        'accessory-list': {
            get dom() {
                return $$('accessory-item').parent();
            },
        },
        protection: {
            get dom() {
                return $$('product-list-wrap')
                    .find('h5')
                    .contains('Device Protection')
                    .parent()
                    .parent();
            },
        },
        delivery: {
            get dom() {
                return $$('product-list-wrap')
                    .find('h5')
                    .contains('Delivery')
                    .parent()
                    .parent();
            },
        },
        shipping: {
            get dom() {
                return $$('product-list-wrap')
                    .find(
                        ':scope > div > div[class*="TabsWrapper-"], .evolv-accessory-list > div > div[class*="TabsWrapper-"]'
                    )
                    .parent();
            },
        },
        'verizon-dollars': {
            get dom() {
                return $('#page .linePad h2 sup')
                    .contains('up')
                    .parent()
                    .parent();
            },
        },
        'payment-info': {
            get dom() {
                return $('#page .linePad h2')
                    .contains('Payment method')
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .parent()
                    .parent();
            },
        },
        'order-summary': {
            get dom() {
                return $('#page [data-testid="expressCheckoutContent"] h2')
                    .contains('Order Summary')
                    .parent()
                    .parent();
            },
        },
        'place-order': {
            get dom() {
                return $$('order-summary').find('#placeOrder');
            },
        },
        interstitial: {
            get dom() {
                return $('#page .linePad > .accessory-interstitial');
            },
        },
        'next-steps': {
            get dom() {
                return $('#page [data-testid="next-steps-container"]');
            },
        },
    });
}

const regex = {
    dateDD: /[A-Za-z]{3}\s\d{1,2},\s202[2-3]/,
    usd: /\$(?:\d|\,)*\.?\d{1,2}/,
    usdPerMo: /\$(?:\d|\,)*\.?\d+\/mo/,
};

function transform(exp) {
    return Array.isArray(exp) ? exp.join('') : exp || '';
}

function html(strings, ...exps) {
    return strings
        .map((s, i) => `${s}${transform(exps[i])}`)
        .join('')
        .replace(/^[\n\r\s]+/, '');
}

function toTitleCase(string) {
    return string.replace(/\w+/g, (word) => {
        return word[0].toUpperCase() + word.substr(1).toLowerCase();
    });
}

function resizeImage(enode, height) {
    enode.markOnce('evolv').each((image) => {
        const heightParam = /\?hei=[0-9]{1,4}/;
        const src = image.attr('src');
        if (heightParam.test(src)) {
            image.attr({
                src: src.replace(heightParam, `?hei=${height}&$pngalpha$`),
                srcset:
                    src.replace(heightParam, `?hei=${height * 2}&$pngalpha$`) +
                    ' 2x',
            });
        }
    });
}

const icons = {
    close: html`
        <svg
            width="18"
            height="18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="m9.878 9 7.9 7.889-.89.889L9 9.878l-7.889 7.9-.889-.89L8.112 9 .221 1.11l.89-.889L9 8.112l7.889-7.89.889.89L9.878 9Z"
                fill="#000"
            />
        </svg>
    `,
    info: html`
        <svg
            role="presentation"
            aria-hidden="true"
            viewBox="0 0 24 24"
            focusable="false"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                vector-effect="non-scaling-stroke"
                stroke="currentColor"
                stroke-width="1"
                fill="none"
            ></circle>
            <rect
                x="10.99"
                y="9.98"
                width="2.02"
                height="8"
                stroke="none"
                fill="currentColor"
            ></rect>
            <rect
                x="10.98"
                y="6"
                width="2"
                height="2"
                stroke="none"
                fill="currentColor"
            ></rect>
        </svg>
    `,
    arrowRight: html`
        <svg
            width="15"
            heiht="14"
            viewBox="0 0 15 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M14.1074 7.00065L7.44073 13.6673L6.84073 13.0747L12.4852 7.43028H0.892578V6.57843H12.4852L6.84073 0.933984L7.44073 0.333984L14.1074 7.00065Z"
                fill="black"
            />
        </svg>
    `,
};

function isMobile() {
    if (!(vzdl && vzdl.env && vzdl.env.platform)) return false;

    const platform = vzdl.env.platform;
    if (
        (platform === 'mobile' || platform === 'mfapp') &&
        window.matchMedia('(max-width: 767px)').matches
    ) {
        return true;
    } else {
        return false;
    }
}

function makeTooltip(text) {
    const tooltip = $(html`
        <span class="evolv-tooltip" tab-index="0"
            >${icons.info}
            <span class="evolv-tooltip-box">
                <span class="evolv-tooltip-box-inner">${text}</span>
            </span>
        </span>
    `);

    return tooltip;
}

function debounce(func, timeout = 17) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

function editHeading() {
    rule.whenItem('place-order').then(() => {
        $$('heading').markOnce('evolv').find('h1').text('Ready to check out?');
    });
}

function addButton(key, vzButton, buttonBar) {
    const buttonId = key.toLowerCase();

    buttonBar.markOnce(`evolv-${buttonId}`).each((buttonBar) => {
        buttonBar.append(
            $(
                `<button class="evolv-button-bar-${buttonId}">${key}</button>`
            ).on('click', () => {
                vzButton.firstDom().click();
            })
        );
    });
}

function makeButtonBar() {
    if ($('.evolv-button-bar').exists()) return;

    rule.whenItem('heading').then((heading) => {
        heading.markOnce('evolv-button-bar').each((heading) => {
            const selectors = {
                Shop: '.linkspace a[data-testid="keep-shopping-link"]',
                'Trade-in':
                    'button[aria-label="Start trade-in"], #tradeinAnotherDevice',
            };

            const buttonBar = $(html` <div class="evolv-button-bar"></div> `);
            buttonBar.insertAfter(heading);

            for (const key in selectors) {
                rule.whenDOM(selectors[key]).then((vzButton) => {
                    addButton(key, vzButton, buttonBar);
                });
            }

            // Watcher for wishlist because whenDOM() is not picking it up
            rule.whenItem('line-pad').then((linePad) => {
                linePad.markOnce('evolv-wishlist').each((linePad) => {
                    function updateWishlist() {
                        const wishlistButton = linePad.find(
                            'a[data-testid="wishlist-view-button"]'
                        );

                        if (wishlistButton.exists()) {
                            addButton('Wishlist', wishlistButton, buttonBar);
                            wishlistButton
                                .parent()
                                .parent()
                                .parent()
                                .addClass('evolv-display-none');
                        }
                    }

                    updateWishlist();

                    linePad
                        .watch({
                            childList: true,
                            subtree: true,
                            attributes: false,
                        })
                        .then(() => {
                            updateWishlist();
                        });
                });
            });
        });
    });
}

function makeAddress(address) {
    if (
        address.next().exists() &&
        address.next().firstDom().classList.contains('evolv-shipping-address')
    )
        return;

    const p = address.find('p');
    const editLink = address.find('a');
    const addressText = editLink.text();
    const addressTypeMatch = p
        .first()
        .text()
        .match(/Ships to|Pick up at/);
    const addressType = addressTypeMatch ? addressTypeMatch[0] : '';
    const headingOptions = {
        'Ships to': 'Shipping address',
        'Pick up at': 'Store address',
        '': '',
    };

    const addressHeading = headingOptions[addressType];

    if (!editLink.exists() && !addressText.length > 0) return;

    const addressNew = $(
        html`<div
            class="evolv-shipping-address"
            ${addressType
                ? `style="--address-prefix: '${addressType.replace(
                      'Ships',
                      'Ship'
                  )}: '"`
                : ''}
        >
            <p class="evolv-shipping-address-heading">${addressHeading}</p>
            <p class="evolv-shipping-address-text">${addressText}</p>
            <button class="evolv-shipping-address-edit">Edit</button>
        </div>`
    );

    addressNew.find('button').on('click', () => editLink.firstDom().click());

    address.markOnce('evolv-hide').afterMe(addressNew);
}

function updateTabPanel(watchPoint) {
    // Update shipping styles for selected option
    watchPoint
        .find('input')
        .el.forEach(
            (input, index) =>
                input.getAttribute('aria-checked') === 'true' &&
                watchPoint.attr({ 'data-evolv-selected': index + 1 })
        );

    const address = watchPoint.find('.rightwidth');

    makeAddress(address);
}

function editShipping(shipping) {
    const watchPoint = shipping.find('[class*="FlexRowWrapper"]');
    // const address = shipping
    //     .find('div[data-testid="shipping_new"] p')
    //     .contains('Ships')
    //     .parent();

    updateTabPanel(watchPoint);

    watchPoint.watch().then(() => {
        updateTabPanel(watchPoint);
    });
}

function editProductShipping(shipping) {
    shipping.markOnce('evolv').each((shipping) => {
        shipping.addClass('evolv-product-shipping');
        editShipping(shipping);
    });
}

function editCartShipping() {
    rule.whenItem('shipping').then((shipping) => {
        shipping.markOnce('evolv').each((shipping) => {
            editShipping(shipping);
        });
    });
}

// All products, both devices and accessories

function editShipsByDate(shipsByDate) {
    const p = shipsByDate.find('p');
    const byText = p.text().match(/[A-Z]+\sby\s/i);
    const oldDate = p.text().match(regex.dateDD);

    if (oldDate === null || byText === null) return;

    const newDate = new Date(oldDate[0]).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    if (!newDate || (newDate && !newDate.length > 0)) return;

    p.markOnce('evolv').text(byText + newDate);
}

function makeEditButton(info, heading) {
    if (
        heading.next().exists() &&
        heading.next().firstDom().classList.contains('evolv-product-edit')
    )
        return;

    const selectorMobile =
        '[type="MOBILE"] a[data-testid="MiniPdpMainComponentEditButton"]';
    const selectorDesktop =
        '[type="DESKTOP"] a[data-testid="MiniPdpMainComponentEditButton"]';

    const editButtons = info
        .find(selectorMobile + ', ' + selectorDesktop)
        .addClass('evolv-display-none');

    if (!editButtons.exists()) return;

    $('<button class="evolv-product-edit">Edit</button>')
        .on('click', () => {
            if (isMobile()) {
                info.find(selectorMobile).firstDom().click();
            } else {
                info.find(selectorDesktop).firstDom().click();
            }
        })
        .insertAfter(heading);
}

function makeRemoveButton(details, info) {
    if (info.firstDom().lastChild.classList.contains('evolv-product-links'))
        return;

    const selectorMobile =
        'div[type="MOBILE"] a[data-testid="show-modal"], [type="MOBILE"] [data-testid="remove-accessory-link"]';
    const selectorDesktop =
        'div[type="DESKTOP"] a[data-testid="show-modal"], [type="DESKTOP"] [data-testid="remove-accessory-link"]';

    const removeButtons = details
        .find(selectorMobile + ', ' + selectorDesktop)
        .addClass('evolv-display-none');

    if (removeButtons.exists()) {
        info.append(
            $(
                html`<div class="evolv-product-links">
                    <button class="evolv-product-remove">Remove</button>
                </div>`
            ).on('click', () => {
                if (isMobile()) {
                    info.find(selectorMobile).firstDom().click();
                } else {
                    details.find(selectorDesktop).firstDom().click();
                }
            })
        );
    }
}

function moveGiftButton(info) {
    const gift = info.find('a[aria-label*="gift"]').parent();

    if (!gift.exists() || info.find('.evolv-product-gift').exists()) return;

    info.find('.evolv-product-links').append(
        gift.markOnce('evolv').addClass('evolv-product-gift')
    );
}

function editProduct(product) {
    const heading = product.find('h2').first();
    const info = heading
        .parent()
        .parent()
        .parent()
        .parent()
        .addClass('evolv-product-info');

    const shipsByDate = info
        .children()
        .regExContains(regex.dateDD)
        .addClass('evolv-product-ships-by');
    const details = info.parent().addClass('evolv-product-details');
    const image = details.find('img');
    const shipping = product.find('[class*="TabsWrapper"]').parent();

    // Fix layout and white space issues
    product
        .addClass('evolv-product-item')
        .find('.evolv-product-details')
        .parent()
        .parent()
        .addClass('evolv-product-details-outer')
        .parent()
        .addClass('evolv-margin-0')
        .parent()
        .addClass('evolv-margin-0');

    image.parent().parent().parent().addClass('evolv-product-image-wrap');

    info.find('div[style*="display:flex"]')
        .first()
        .addClass('evolv-display-block');

    heading
        .parent()
        .addClass('evolv-product-heading-wrap')
        .parent()
        .addClass('evolv-product-heading-wrap-outer')
        .parent()
        .addClass('evolv-display-block');

    resizeImage(image, 150);
    editShipsByDate(shipsByDate);
    makeEditButton(info, heading);
    makeRemoveButton(details, info);
    moveGiftButton(info);
    editProductShipping(shipping);
}

// Devices
function makeRetail(retail, activation) {
    const next = retail.next();
    if (next.hasClass('evolv-device-retail')) next.firstDom().remove();

    const p = retail.find('p');
    p.filter('[evolv="true"]').each((marked) =>
        marked.firstDom().removeAttribute('evolv')
    );

    // Match any p tag that contains dollar amounts but not the word fee
    const priceArray = p
        .regExContains(regex.usd)
        .regExContains(/^((?!fee).)+$/)
        .markOnce('evolv')
        .text()
        .match(regex.usd);
    const price = priceArray !== null ? priceArray[0] : '';

    if (!price) return;

    const termsArray = [];

    const upgradeFee = p.regExContains(/upgrade\sfee.*\$(?:\d|\,)*\.?\d{1,2}/i);

    if (upgradeFee.exists()) {
        let feeArray = upgradeFee.markOnce('evolv').text().match(regex.usd);
        if (feeArray !== null) {
            termsArray.push(`${feeArray[0].replace(/\.00/, '')} upgrade fee`);
        }
    }

    if (activation.exists() && !activation.text().includes('waived')) {
        let feeArray = activation
            .addClass('evolv-display-none')
            .find('p')
            .text()
            .match(regex.usd);
        if (feeArray !== null) {
            termsArray.push(
                `${feeArray[0].replace(/\.00/, '')} activation fee`
            );
        }
    }

    const retailNew = $(html`<div class="evolv-device-retail">
        <p class="evolv-device-retail-price">Full retail price: ${price}</p>
        <p class="evolv-device-retail-terms">
            ${termsArray.join(', ')}${p
                .markOnce('evolv')
                .el.map((e) => `<br>${e.textContent}`)
                .join('\n')}
        </p>
    </div>`);

    retail.addClass('evolv-display-none').afterMe(retailNew);
}

function getPriceText(p) {
    const price = p
        .regExContains(/\$[0-9].+\/mo/)
        .markOnce('evolv')
        .firstDom().childNodes[0].data;

    const strikethroughText = p
        .find('span[style*="text-decoration:line-through"]')
        .first()
        .markOnce('evolv')
        .text();
    let priceStrikethrough = '';

    if (strikethroughText.length > 0) {
        priceStrikethrough = $(
            `<span class="evolv-device-financing-price-strikethrough">${strikethroughText}</span>`
        ).firstDom().outerHTML;
    }
    return html`<p class="evolv-device-financing-price">
        ${price} ${priceStrikethrough}
    </p>`;
}

function updateFinancingPrice(financing, financingNew) {
    const p = financing.find('p');
    p.filter('[evolv="true"]').each((marked) =>
        marked.firstDom().removeAttribute('evolv')
    );
    const priceText = getPriceText(p);
    financingNew.find('.evolv-device-financing-price').html(priceText);
}

function makeFinancing(financing, activation) {
    if (
        financing.next().firstDom().classList.contains('evolv-device-financing')
    )
        return $();

    const p = financing.find('p');
    const priceText = getPriceText(p);

    // Have to find span first because of different markup structures
    let time = p.find('span').contains('months').text();
    if (time === '') {
        time = p.contains('months').markOnce('evolv').text();
    }

    const rate = p
        .contains('APR')
        .markOnce('evolv')
        .text()
        .replace('APR.', 'APR;');

    // Exit if no price, time, or rate
    if (!$(priceText).text().length > 0) return;

    for (const string of [time, rate]) {
        if (!string.length > 0) return;
    }

    let termsArray = [`${time}, ${rate}`];
    const upgradeFee = p.regExContains(/upgrade\sfee.*\$(?:\d|\,)*\.?\d{1,2}/);

    if (upgradeFee.exists()) {
        let fee = upgradeFee.markOnce('evolv').text().match(regex.usd);
        if (fee !== null) {
            termsArray.push(`${fee[0].replace(/\.00/, '')} upgrade fee`);
        }
    }

    if (activation.exists() && !activation.text().includes('waived')) {
        let fee = activation
            .markOnce('evolv-hide')
            .find('p')
            .text()
            .match(regex.usd);
        if (fee !== null) {
            termsArray.push(`${fee[0].replace(/\.00/, '')} activation fee`);
        }
    }

    const financingNew = $(html`<div class="evolv-device-financing">
        ${priceText}
        <p class="evolv-device-financing-terms">
            ${termsArray.join(', ')}${p
                .markOnce('evolv')
                .el.map((e) => `<br>${e.textContent}`)
                .join('/n')}
        </p>
    </div>`);
    financing.markOnce('evolv-hide').afterMe(financingNew);

    financing
        .watch({
            attributes: false,
            childList: true,
            characterData: true,
            subtree: true,
        })
        .then(() => {
            updateFinancingPrice(financing, financingNew);
        });
}

function makeLine(line) {
    if (!line.exists()) return;
    if (
        line.next().exists() &&
        line.next().firstDom().classList.contains('evolv-device-line')
    )
        return;

    const p = line.find('p');
    const lineText = p
        .regExContains(/Upgrading|New\sline/)
        .text()
        .match(/Upgrading|New\sline/)[0];
    const number = p.regExContains(/(\d|X){3}.(\d|X){3}.(\d|X){4}/);
    const numberText = number.exists()
        ? number
              .text()
              .match(/(\d|X){3}.(\d|X){3}.(\d|X){4}/)[0]
              .replaceAll('.', '-')
        : '';

    if (lineText.length > 0)
        line.markOnce('evolv-hide').afterMe(
            $(`<p class="evolv-device-line">${lineText} ${numberText}</p>`)
        );
}

function editDevices() {
    rule.whenItem('device-item').then((devices) => {
        devices.markOnce('evolv').each((device) => {
            editProduct(device);

            const a = device.find('a');
            const p = device.find('p');
            const infoP = p.filter('.evolv-product-info p');
            device.find('h3');

            // Device info
            p.regExContains(/.*receive.*promo credit.*/)
                .parent()
                .parent()
                .addClass('evolv-device-credit');
            const retail = infoP
                .regExContains(/retail.*\$(?:\d|\,)*\.?\d{1,2}/i)
                .parent()
                .parent();
            const financing = infoP
                .regExContains(/\$[0-9].+\/mo/)
                .first()
                .parent()
                .parent();
            const activation = infoP
                .regExContains(/activation\sfee/i)
                .parent()
                .parent();
            const line = infoP
                .regExContains(/Upgrading|New\sline/)
                .parent()
                .parent()
                .parent();
            const unlocking = device
                .find('[data-testid="deviceUnblockPolicyLink"]')
                .parent();

            p.contains('waived').addClass('evolv-text-xsmall-gray');

            if (financing.exists()) {
                makeFinancing(financing, activation);
            } else if (retail.exists()) {
                makeRetail(retail, activation);
                retail.watch().then(() => makeRetail(retail, activation));
            }

            makeLine(line);
            unlocking.addClass('evolv-device-unlocking');

            // Plan
            const planLink = a.contains('Change plan');
            const plan = planLink.parent().parent().parent().parent();

            plan.markOnce('evolv').each((plan) => {
                plan.addClass(`evolv-device-add-on evolv-device-plan`)
                    .find('h3')
                    .parent()
                    .parent()
                    .addClass('evolv-margin-top-025')
                    .parent()
                    .prepend(
                        $(`<div class="evolv-text-xsmall-gray">Plan</div>`)
                    );

                const price = plan
                    .find('p')
                    .regExContains(regex.usd)
                    .parent()
                    .addClass('evolv-device-add-on-price');

                price
                    .find('span')
                    .contains('was')
                    .addClass('evolv-display-none');
            });

            planLink.find('[class*="Wrapper-"]').text('Edit');

            // Device Protection
            const protection = device.find(
                'div[data-testid="protectionSection"]'
            );
            const learn = protection.find(
                'div[data-testid="LearnMoreLinkMobile"]'
            );

            protection.markOnce('evolv').each((protection) => {
                const heading = protection.find('h3');

                protection.addClass(
                    `evolv-device-add-on evolv-device-protection`
                );

                const headingText = toTitleCase(
                    heading.text().replace(regex.usd, '').trim()
                );

                heading
                    .text(headingText)
                    .parent()
                    .parent()
                    .addClass('evolv-margin-top-025')
                    .parent()
                    .addClass(
                        'evolv-margin-0 evolv-padding-0 evolv-border-none'
                    )
                    .prepend(
                        $(
                            `<div class="evolv-text-xsmall-gray">Protection</div>`
                        )
                    );

                protection
                    .find('p')
                    .regExContains(regex.usd)
                    .addClass('evolv-device-add-on-price');
            });

            if (learn.find('a').text().trim() === '') {
                learn.addClass('evolv-display-none');
            }
        });
    });
}

// Accessories

function editAccessories() {
    const accessoryItems = $(
        $('div[data-testid^="accessory-item-"]').el.filter(
            (item) => item.closest('.accessory-interstitial') === null
        )
    );
    accessoryItems.markOnce('evolv').each((accessory) => {
        editProduct(accessory);

        const priceLog = accessory.find('div[data-testid="retail-price-log"]');

        if (priceLog.exists()) {
            priceLog
                .find(':scope > div > p')
                .regExContains(regex.usd)
                .parent()
                .addClass('evolv-accessory-prices');

            priceLog
                .find('span')
                .contains('was')
                .addClass('evolv-display-none');
        } else {
            accessory
                .find('p')
                .regExContains(regex.usd)
                .first()
                .parent()
                .addClass('evolv-accesory-price');
        }

        accessory
            .find('button[data-testid="increment-button"]')
            .parent()
            .parent()
            .addClass('evolv-accessory-increment');
    });
}

function editProducts() {
    editDevices();
    editAccessories();

    rule.whenItem('product-list-wrap').then((productListWrap) => {
        productListWrap.watch().then(() => {
            editDevices();
            editAccessories();
            rule.reactivate();
        });
    });
}

function updateProtectionItems(protection) {
    protection
        .find('div.display')
        .parent()
        .markOnce('evolv')
        .each((protectionItem) => {
            protectionItem.addClass('evolv-protection-item');
            const p = protectionItem.find('p');
            const heading = p
                .regExContains(/Multi.Device|Home\sDevice\sProtect/)
                .addClass('evolv-protection-heading');
            const terms = p
                .regExContains(regex.usdPerMo)
                .first()
                .addClass('evolv-protection-terms');

            heading.parent().addClass('evolv-protection-item-inner');

            if (/Multi.Device/.test(heading.text())) {
                protectionItem.addClass('evolv-protection-item-multi');
                if (terms.exists) {
                    let perMo = terms.text().match(regex.usdPerMo)[0];
                    terms.text(`${perMo} protects 3-10 eligible devices`);
                }
            }
            if (/Home\sDevice\sProtect/.test(heading.text()))
                protectionItem.addClass('evolv-protection-item-home');
        });
}

function editDeviceProtection() {
    rule.whenItem('protection').then((protection) => {
        protection.find('h5').parent().addClass('evolv-display-none');

        updateProtectionItems(protection);
        protection.watch().then(() => updateProtectionItems(protection));

        if (!isMobile()) {
            protection.addClass('evolv-desktop-tablet');
        }
    });
}

function template$2({
    headingText,
    savingsText,
    linkCalculated,
    linkRemove,
    button,
}) {
    const card = $(html`
        <div class="evolv-trade-in-new-card">
            <h2>${headingText}</h2>
            <p>${savingsText}</p>
            <div class="evolv-trade-in-new-card-links">
                ${linkRemove.exists()
                    ? html`<button class="evolv-trade-in-button-remove">
                          Remove
                      </button>`
                    : ''}
                ${linkCalculated.exists()
                    ? html`<button class="evolv-trade-in-button-calculate">
                          See how value is calculated
                      </button>`
                    : ''}
            </div>
            ${button.exists()
                ? html`<button class="evolv-trade-in-button">
                      ${button.text()}
                  </button>`
                : ''}
        </div>
    `);

    card.find('button.evolv-trade-in-button-remove').on('click', () =>
        linkRemove.firstDom().click()
    );
    card.find('button.evolv-trade-in-button-calculate').on('click', () =>
        linkCalculated.firstDom().click()
    );
    card.find('button.evolv-trade-in-button').on('click', () =>
        button.firstDom().click()
    );

    return card;
}

function makeTradeInItem(tradeIn, tradeInSectionNew) {
    const p = tradeIn.find('p');
    const amounts = p.el[1].textContent.match(regex.usd) || [];

    tradeInSectionNew.append(
        template$2({
            headingText: 'Trade-in: ' + p.first().text(),
            savingsText:
                amounts.length > 0
                    ? `${
                          amounts[amounts.length - 1]
                      } trade-in value pending receiving and appraising the device. A trade-in kit will be sent to the listed shipping address.`
                    : p.el[1].text(),
            linkCalculated: tradeIn.find('#howitsCalculated'),
            linkRemove: tradeIn.find('#removeTradein'),
            button: tradeIn.find('button'),
        })
    );
}

function updateTradeInSection(tradeInSection) {
    let tradeInSectionNew = $('.evolv-trade-in-new');
    if (tradeInSectionNew.exists()) tradeInSectionNew.firstDom().remove();

    tradeInSectionNew = $(html`<section class="evolv-trade-in-new"></section>`);
    let tradeIns = tradeInSection
        .find('div[data-testid="removeTradeinModalContainer"]')
        .parent()
        .parent();

    // If there's trade-in items, put the new items on the page and "hide visually" the original module,
    // Can't display none because that kills the mobile modals
    // If it's the start trade-in module just hide the module

    tradeIns.each((tradeIn) => makeTradeInItem(tradeIn, tradeInSectionNew));
    if (tradeInSectionNew.children().exists()) {
        tradeInSectionNew.insertAfter(
            tradeInSection.addClass('evolv-hide-visually').last()
        );
    } else if (
        tradeInSection.find('button[aria-label="Start trade-in"]').exists()
    ) {
        tradeInSection.addClass('evolv-display-none');
    }
}

function updateTradeInButton(tradeInSection) {
    const buttonBar = $('body #page .evolv-button-bar');
    const tradeInButton = buttonBar.find('.evolv-button-bar-trade-in');
    const tradeInButtonNew = $(
        '<button class="evolv-button-bar-trade-in">Trade-in</button>'
    );
    const vzButton = tradeInSection.find(
        'button[aria-label="Start trade-in"], #tradeinAnotherDevice'
    );

    tradeInButton.firstDom().remove();

    if (!vzButton.exists()) {
        return;
    }

    tradeInButtonNew.on('click', () => vzButton.firstDom().click());
    buttonBar.append(tradeInButtonNew);
}

function makeTradeInSection() {
    rule.whenItem('trade-in-section').then((tradeInSection) => {
        tradeInSection.markOnce('evolv').each((tradeInSection) => {
            updateTradeInSection(tradeInSection);

            tradeInSection.watch().then(() => {
                updateTradeInSection(tradeInSection);
                updateTradeInButton(tradeInSection);
            });
        });
    });
}

function template$1(className) {
    return html`
        <section class="${className}" evolv-slide-count="0">
            <h2>You qualify for these offers</h2>
            <div class="evolv-promo-carousel">
                <div class="evolv-promo-carousel-track"></div>
            </div>
            <div class="evolv-promo-pagination"></div>
        </section>
    `;
}

function scrollCarousel(slide, track) {
    track.firstDom().scrollLeft = slide.firstDom().offsetLeft - 20;
}

function makeSlideObserver(promoSection) {
    const track = promoSection.find('.evolv-promo-carousel-track');
    const pagination = promoSection.find('.evolv-promo-pagination');

    return new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting === true) {
                    const slides = track.children();
                    slides.el.forEach((slide, index) => {
                        const buttons = pagination.children();
                        if (slide === entry.target) {
                            buttons.el[index].classList.add(
                                'evolv-slide-active'
                            );
                        } else {
                            buttons.el[index].classList.remove(
                                'evolv-slide-active'
                            );
                        }
                    });
                }
            });
        },
        {
            root: track.firstDom(),
            rootMargin: '0px',
            threshold: 1.0,
        }
    );
}

function addSlide(slide, promoSection, observer) {
    const track = promoSection.find('.evolv-promo-carousel-track');
    const pagination = promoSection.find('.evolv-promo-pagination');

    track.append(slide);
    pagination.append(
        $('<button class="evolv-promo-pagination-button"></button>').on(
            'click',
            () => scrollCarousel(slide, track)
        )
    );

    // Watch slides to update pagination styles
    observer.observe(slide.firstDom());

    // Increment slide count for conditional styles
    let slideCount = parseInt(promoSection.attr('evolv-slide-count'));
    slideCount++;
    promoSection.attr({ 'evolv-slide-count': slideCount });

    // If .promo-section does not exist on the page create it
    if (!promoSection.isConnected()) {
        rule.whenItem('payment-info').then((paymentInfo) => {
            paymentInfo.markOnce('evolv-promo-section').each((paymentInfo) => {
                paymentInfo.beforeMe(promoSection);
            });
        });
    }
}

function makePromoBogoSlides(promoSection, observer) {
    const track = promoSection.find('.evolv-promo-carousel-track');
    promoSection.find('.evolv-promo-pagination');

    rule.whenItem('promo-bogo').then((promoBogos) => {
        promoBogos
            .markOnce('evolv-hide')
            .el.forEach((promoNode, promoIndex) => {
                const promo = $(promoNode).attr({
                    'evolv-promo': `bogo-${promoIndex}`,
                });

                const slide = $(html`
                    <div
                        class="evolv-promo-carousel-slide"
                        evolv-promo-source="bogo-${promoIndex}"
                    >
                        <div class="evolv-promo-carousel-slide-info"></div>
                    </div>
                `);
                const ctas = $(
                    `<div class="evolv-promo-carousel-slide-ctas"></div>`
                );

                const button = promo.find('button');

                button
                    .find('span[class*="StyledChildWrapper-"]')
                    .text('Select');

                ctas.append(button);

                ctas.append(
                    promo
                        .find('a')
                        .addClass('evolv-promo-carousel-slide-details')
                );

                slide
                    .find('.evolv-promo-carousel-slide-info')
                    .append(
                        $(
                            html`<h3>
                                ${promo.find('p').firstDom().childNodes[0].data}
                            </h3>`
                        )
                    )
                    .append($(html`<p>${promo.find('.items h3').text()}</p>`))
                    .append(ctas);

                addSlide(slide, promoSection, observer);
            });

        // Watch for bogo promos being removed from the page and remove them from the carousel
        promoBogos
            .parent()
            .watch({
                attributes: false,
                childList: true,
                characterData: false,
                subtree: false,
            })
            .then(() => {
                track.children().each((slide) => {
                    const promoSource = slide.attr('evolv-promo-source');
                    if (!promoSource) return;

                    if (
                        promoBogos.el.findIndex(
                            (promoEl) =>
                                promoEl.getAttribute('evolv-promo') ===
                                promoSource
                        ) === -1
                    ) {
                        let slideCount =
                            parseInt(promoSection.attr('evolv-slide-count')) -
                            1;
                        if (!slideCount || slideCount < 0) slideCount = 0;
                        promoSection.attr({ 'evolv-slide-count': slideCount });
                        slide.firstDom().remove();
                    }
                });
            });
    });
}

function makePromoHomeSlide(promoSection, observer) {
    rule.whenItem('promo-home').then((promoHome) => {
        promoHome
            .markOnce('evolv-hide')
            .first()
            .each((promo) => {
                const slide = $(html`
                    <div class="evolv-promo-carousel-slide">
                        <div class="evolv-promo-carousel-slide-info">
                            <!-- <p class="evolv-promo-carousel-slide-category">Protection</p> -->
                            <h3>
                                Protect your home tech with Verizon Home Device
                                Protect for $25/mo
                            </h3>
                        </div>
                    </div>
                `);

                slide
                    .find('.evolv-promo-carousel-slide-info')
                    .afterMe(
                        promo
                            .find('.learnBtn')
                            .addClass('evolv-promo-carousel-slide-ctas')
                    );

                addSlide(slide, promoSection, observer);
            });
    });
}

function makePromoConnectedSlides(promoSection, observer) {
    rule.whenItem('promo-connected').then((promoConnected) => {
        promoConnected.markOnce('evolv-hide').each((promo) => {
            const contents = promo.find('.items');
            const slide = $(html`
                <div
                    class="evolv-promo-carousel-slide evolv-promo-carousel-slide-connected"
                >
                    <div class="evolv-promo-carousel-slide-info"></div>
                </div>
            `);
            slide.find('.evolv-promo-carousel-slide-info').append(contents);

            slide
                .find('a')
                .parent()
                .parent()
                .addClass('evolv-promo-carousel-slide-connected-row');

            addSlide(slide, promoSection, observer);
        });
    });
}

function makePromoGetMoreSlides(promoSection, observer) {
    rule.whenItem('promo-get-more').then((promoGetMore) => {
        promoGetMore.markOnce('evolv-hide').each((promo) => {
            const p = promo.find('.descWidth p');
            const headingText = p.first().markOnce('evolv').text();
            const contents = p.markOnce('evolv');
            const button = promo.find('.learnBtn');
            const slide = $(html`
                <div
                    class="evolv-promo-carousel-slide evolv-promo-carousel-slide-get-more"
                >
                    <div class="evolv-promo-carousel-slide-info">
                        <h3>${headingText}</h3>
                    </div>
                    <div class="evolv-promo-carousel-slide-ctas"></div>
                </div>
            `);

            slide.find('.evolv-promo-carousel-slide-info').append(contents);
            slide.find('.evolv-promo-carousel-slide-ctas').append(button);

            addSlide(slide, promoSection, observer);
        });
    });
}

function makePromoCarousel() {
    if ($('.evolv-promo-section').exists()) return;

    const promoSection = $(template$1('evolv-promo-section'));
    const slideObserver = makeSlideObserver(promoSection);

    makePromoBogoSlides(promoSection, slideObserver);
    makePromoHomeSlide(promoSection, slideObserver);
    makePromoConnectedSlides(promoSection, slideObserver);
    makePromoGetMoreSlides(promoSection, slideObserver);
}

function insertInitial(amount, button, dollarsNew) {
    const contents = $(html`<div
        class="evolv-checkout-dollars-inner evolv-checkout-dollars-inner-initial"
    >
        <div class="evolv-checkout-dollars-info">
            <h2>verizon<sup>up&nbsp;</sup></h2>
            <p>${amount} Device Dollars available</p>
        </div>
    </div>`);

    contents.append(
        $(html`<button class="evolv-link-button">Apply now</button>`).on(
            'click',
            () => button.firstDom().click()
        )
    );

    dollarsNew.firstDom().innerHTML = '';
    dollarsNew.append(contents);
}

function insertActivated(amount, button, dollarsNew) {
    const contents = $(html`<div
        class="evolv-checkout-dollars-inner evolv-checkout-dollars-inner-activated"
    >
        <div class="evolv-checkout-dollars-info">
            <h2>verizon<sup>up&nbsp;</sup></h2>
            <p>${amount} Device Dollars applied</p>
        </div>
    </div>`);

    contents.append(
        $(html`<button class="evolv-link-button">Edit</button>`).on(
            'click',
            () => button.firstDom().click()
        )
    );

    dollarsNew.firstDom().innerHTML = '';
    dollarsNew.append(contents);
}

function updateContent(dollars, dollarsNew) {
    const amount = dollars
        .find('p strong, h2')
        .regExContains(regex.usd)
        .text()
        .match(regex.usd)[0];
    const button = dollars.find('button');
    const message = dollars.find('h2').regExContains(/(apply|applied)/i);

    if (amount === '' || !button.exists()) return;

    if (message.text().includes('apply')) {
        insertInitial(amount, button, dollarsNew);
        return true;
    } else if (message.text().includes('applied')) {
        insertActivated(amount, button, dollarsNew);
        return true;
    }
}

function makeVerizonDollars() {
    rule.whenItem('verizon-dollars').then((dollars) => {
        dollars.markOnce('evolv').each((dollars) => {
            const dollarsNew = $(
                '<div class="evolv-checkout-item evolv-checkout-dollars"></div>'
            );

            if (!updateContent(dollars, dollarsNew)) return;

            rule.whenDOM(
                '#page .linePad .evolv-checkout-item-wrap .evolv-checkout-item'
            ).then((items) => {
                items.last().afterMe(dollarsNew);
                dollars.addClass('evolv-display-none');

                dollars
                    .watch({
                        attributes: false,
                        childList: true,
                        characterData: true,
                        subtree: true,
                    })
                    .then(() => {
                        updateContent(dollars, dollarsNew);
                    });
            });
        });
    });
}

function editPaymentInfo() {
    rule.whenItem('payment-info').then((paymentInfo) => {
        paymentInfo.markOnce('evolv').each((paymentInfo) => {
            paymentInfo.prepend(
                $('<h2 class="evolv-checkout-heading">Checkout</h2>')
            );

            const paymentInfo2 = $('.linePad [data-testid="service-address"]')
                .parent()
                .parent()
                .parent();
            const checkoutItemWrap = paymentInfo
                .children('div')
                .first()
                .addClass('evolv-checkout-item-wrap');
            const paymentHeadings = paymentInfo.find(':scope > div h2');
            const paymentHeadings2 = paymentInfo2.find('h2');
            const paymentMethod = paymentHeadings
                .contains('Payment method')
                .parent()
                .parent()
                .parent()
                .parent()
                .markOnce('evolv')
                .addClass(
                    'evolv-checkout-item evolv-checkout-item-payment-method'
                );
            const billingAddress = paymentInfo
                .find('[data-testid="billing-address"]')
                .parent()
                .markOnce('evolv')
                .addClass('evolv-checkout-item');
            const contactInfo = paymentHeadings
                .contains('Contact Info')
                .parent()
                .parent()
                .parent()
                .parent()
                .markOnce('evolv')
                .addClass('evolv-checkout-item');
            const serviceAddress = paymentInfo2
                .find('[data-testid="service-address"]')
                .parent()
                .markOnce('evolv')
                .children()
                .first()
                .addClass('evolv-checkout-item');
            const otherItems = paymentMethod
                .parent()
                .find(':scope > div')
                .markOnce('evolv')
                .children()
                .first()
                .addClass('evolv-checkout-item');
            const otherItems2 = serviceAddress
                .parent()
                .parent()
                .find(':scope > div')
                .markOnce('evolv')
                .first()
                .addClass('evolv-checkout-item');

            paymentHeadings
                .parent()
                .parent()
                .addClass('evolv-checkout-item-heading');
            paymentHeadings2
                .parent()
                .parent()
                .addClass('evolv-checkout-item-heading');

            paymentInfo2.addClass('evolv-display-none');

            let checkoutSections = [
                contactInfo.firstDom(),
                serviceAddress.firstDom(),
                paymentMethod.firstDom(),
                billingAddress.firstDom(),
            ];

            otherItems.each((item) => {
                checkoutSections.push(item.firstDom());
            });

            otherItems2.each((item) => {
                checkoutSections.push(item.firstDom());
            });

            checkoutSections = checkoutSections.filter((section) => !!section);

            const paymentNew = checkoutItemWrap.append($(checkoutSections));
            const editLinks = paymentNew
                .find('a span')
                .contains('Edit')
                .html(icons.arrowRight)
                .parent()
                .addClass('evolv-checkout-arrow-link');

            editLinks.each((editLink) => {
                editLink.parent().parent().parent().append(editLink);
            });

            paymentHeadings.contains('Contact Info').text('Contact');

            serviceAddress
                .find('h2')
                .append(makeTooltip('Where each line will primarily be used.'));
            serviceAddress
                .find('p')
                .contains('primarily')
                .addClass('evolv-display-none');
            paymentMethod
                .find('p')
                .contains('Verizon Wireless account')
                .addClass('evolv-display-none');
        });
    });
}

function updateYoureSaving(orderSummary) {
    const youreSavingLink = orderSummary.find('a[aria-label*="See how"]');

    youreSavingLink
        .parent()
        .parent()
        .parent()
        .addClass('evolv-order-summary-youre-saving');
}

function alignPromoCode(promoCodeLink, promoCodeForm, lastCheckoutItem) {
    const checkoutBox = lastCheckoutItem.firstDom().getBoundingClientRect();
    const scrollTop = document.documentElement.scrollTop;

    [promoCodeLink, promoCodeForm].forEach((promoCode) => {
        if (!promoCode.exists()) return;
        const element = promoCode.firstDom();
        const elementHeight = element.getBoundingClientRect().height;

        lastCheckoutItem
            .firstDom()
            .style.setProperty(
                '--evolv-margin-bottom',
                `${elementHeight + 21}px`
            );
        element.style.setProperty(
            '--evolv-top',
            `${Math.round(checkoutBox.bottom + scrollTop + 21)}px`
        );
        element.style.setProperty(
            '--evolv-left',
            `${Math.round(checkoutBox.left)}px`
        );
    });

    if (!promoCodeLink.exists() && !promoCodeForm.exists()) {
        lastCheckoutItem
            .firstDom()
            .style.setProperty('--evolv-margin-bottom', `0`);
    }
}

function promoCodeShenanigans(orderSummary) {
    rule.whenDOM('#page .evolv-checkout-item-wrap').then((checkoutItemWrap) => {
        const lastCheckoutItem = checkoutItemWrap
            .find(':scope > :not(:empty)')
            .last();

        lastCheckoutItem.addClass('evolv-checkout-item-last');

        let promoCodeLink = orderSummary.find(
            '[data-testid="promo-code-text-link"]'
        );
        let promoCodeForm = $('form[novalidate]')
            .parent()
            .addClass('evolv-order-summary-code-form');

        // Let the hackiness begin
        // rule.whenDOM() would not find this element so I use watch instead
        orderSummary.watch().then(() => {
            promoCodeLink = orderSummary.find(
                '[data-testid="promo-code-text-link"]'
            );
            promoCodeForm = orderSummary
                .find('form[novalidate]')
                .parent()
                .addClass('evolv-order-summary-code-form');

            orderSummary
                .find('a[data-testid="remove-promo-link"]')
                .parent()
                .addClass('evolv-order-summary-promo-code');

            alignPromoCode(promoCodeLink, promoCodeForm, lastCheckoutItem);

            // Not related to promo codes just borrowing the same watcher
            updateYoureSaving(orderSummary);
        });

        // Adds custom properties to use position:absolute to move element that is
        // too delicate relocate
        alignPromoCode(promoCodeLink, promoCodeForm, lastCheckoutItem);

        // Watch the page for dom changes that could cause layout shift and update
        // element position.
        $$('page')
            .watch()
            .then(() => {
                alignPromoCode(promoCodeLink, promoCodeForm, lastCheckoutItem);
            });

        // Watch window size to move element
        new ResizeObserver((entries) => {
            alignPromoCode(promoCodeLink, promoCodeForm, lastCheckoutItem);
        }).observe(document.body);
    });
}

function editOrderSummary() {
    rule.whenItem('order-summary').then((orderSummary) => {
        orderSummary.markOnce('evolv').each((orderSummary) => {
            $('#page .linePad').append(orderSummary);

            orderSummary
                .find('h2')
                .parent()
                .addClass('evolv-order-summary-heading');

            if (orderSummary.find('#placeOrder').exists()) {
                orderSummary.addClass('evolv-contains-place-order');
            }

            promoCodeShenanigans(orderSummary);

            const dueMonthly = orderSummary
                .find('h3')
                .contains('monthly')
                .parent()
                .addClass('evolv-order-summary-due-monthly');
            const dueToday = orderSummary
                .find('#toggle-due-today-container')
                .closest('div[data-testid="accordion-content"]')
                .addClass('evolv-order-summary-due-today');

            dueToday.watch().then(() => {
                const p = dueToday.find('p p');

                p.regExContains(regex.usd).addClass(
                    'evolv-order-summary-due-today-amount'
                );

                p.regExContains(/includes.*taxes/i)
                    .text('Incl taxes and fees')
                    .parent()
                    .addClass('evolv-order-summary-due-today-taxes');
            });

            dueMonthly.find('a span').contains('View details').text('Details');

            updateYoureSaving(orderSummary);

            orderSummary
                .find(
                    ':scope > div:not([data-testid="next-steps-container"]) > div[type="xLight"]'
                )
                .parent()
                .addClass('evolv-display-none');

            orderSummary
                .find('.returnpolicy')
                .parent()
                .addClass('evolv-order-summary-bottom-links');
        });
    });
}

function template(device, text) {
    return $(html`<section
        class="evolv-next-steps-new evolv-next-steps-new-${device}"
    >
        <h2>Next Steps</h2>
        <p>${text}</p>
        <button>Continue</button>
    </section>`);
}

function editNextSteps() {
    rule.whenItem('next-steps').then((nextSteps) =>
        nextSteps.markOnce('evolv').each((nextSteps) => {
            let nextStepsNewMobile;
            let nextStepsNewDesktop;

            nextSteps.find('ul').each((list) => {
                // Convert bulleted list of next steps into a sentence

                // Get list and extract text
                const textArray = list
                    .find('li')
                    .el.map((e) => e.textContent.trim());

                if (textArray.length < 1) return;

                // Make first letter of every phrase lowercase (except the first phrase)
                for (let i = 1; i < textArray.length; i++) {
                    textArray[i] =
                        textArray[i][0].toLowerCase() +
                        textArray[i].substring(1);
                }

                // Combine phrases into a sentence
                let sentence;

                if (textArray.length > 1) {
                    const last = textArray.pop();
                    sentence = textArray.join(', ') + ' and ' + last + '.';
                } else {
                    sentence = textArray[0] + '.';
                }

                if (sentence.length < 7) return;

                nextStepsNewMobile = template('mobile', sentence);
                nextStepsNewDesktop = template('desktop', sentence);
            });

            const button = nextSteps.find('button');
            if (!button.exists()) return;

            nextStepsNewMobile
                .find('button')
                .on('click', () => button.firstDom().click());
            nextStepsNewDesktop
                .find('button')
                .on('click', () => button.firstDom().click());

            $$('payment-info')
                .markOnce('evolv-next-steps')
                .beforeMe(nextStepsNewMobile);

            nextSteps.markOnce('evolv-hide').afterMe(nextStepsNewDesktop);
        })
    );
}

function updateSlide(slide) {
    const p = slide.find('p');
    const promo = p.filter('[class*="StyledMicro-"]').first();
    const heading = slide.find('h2, h3').first();
    const img = slide.find('img');
    const price = p
        .regExContains(regex.usd)
        .addClass('evolv-interstitial-slide-price');
    const color = slide.find('[aria-label="color"]').parent();

    promo
        .parent()
        .addClass('evolv-display-none evolv-height-auto evolv-padding-0');

    promo
        .regExContains(/[A-Z]/i)
        .parent()
        .removeClass('evolv-display-none')
        .addClass('evolv-interstitial-slide-promo');

    resizeImage(img, 133);
    img.parent()
        .addClass('evolv-height-auto evolv-padding-0')
        .parent()
        .parent()
        .addClass('evolv-interstitial-slide-heading-wrap');

    heading.text(heading.text().trim().replace(/\s+/g, ' '));
    heading.parent().addClass('evolv-display-block');

    slide
        .find('.addToOrderButton')
        .parent()
        .parent()
        .addClass('evolv-interstitial-slide-add-to-order');

    price.find('span').contains('was').addClass('evolv-display-none');

    color
        .addClass('evolv-interstitial-slide-color')
        .find('[class*="InputWrapper-"]')
        .parent()
        .addClass('evolv-interstitial-slide-color-input-wrap');
}

function updateSlides(accessoryItemWrap) {
    accessoryItemWrap
        .find('div[data-testid^="accessory-item-"]')
        .each((slide) => updateSlide(slide));
}

function editAccessoryInterstitial() {
    rule.whenItem('interstitial').then((interstitial) => {
        let accessoryItemWrap = interstitial
            .find(
                '[data-testid="accessory-list-container"] div[data-testid^="accessory-item-"]'
            )
            .parent()
            .filter(
                ':not([data-testid="accessoryInterstitial-slider-wrapper-checkout"])'
            )
            .addClass('evolv-interstitial-item-wrap');
        if (!accessoryItemWrap.exists())
            accessoryItemWrap = interstitial
                .find('.swiper-wrapper')
                .addClass('evolv-interstitial-item-wrap');

        const heading = interstitial.find('h2').first().parent();
        const headerInner = heading
            .parent()
            .addClass('evolv-interstitial-header-inner');
        const dropDown = heading.find('span[class*=DropdownWrapper-]');
        const tooltip = headerInner.find('span[class*=TooltipWrapper-]');
        tooltip.parent().parent().addClass('evolv-interstitial-heading-new');

        if (dropDown.exists()) {
            heading
                .find('div[aria-live=assertive]')
                .firstDom().childNodes[0].data = '';
        } else {
            heading.addClass('evolv-display-none');
        }

        dropDown
            .addClass('evolv-width-100')
            .parent()
            .addClass('evolv-display-block')
            .parent()
            .addClass('evolv-margin-0');

        updateSlides(accessoryItemWrap);

        const debounceUpdateSlides = debounce((accessoryItemWrap) =>
            updateSlides(accessoryItemWrap)
        );

        accessoryItemWrap
            .watch({
                attributes: false,
                childList: true,
                characterData: false,
                subtree: true,
            })
            .then(() => {
                // updateSlides(accessoryItemWrap)

                debounceUpdateSlides(accessoryItemWrap);
            });
    });
}

function makeFooter() {
    const footer = $(html`
        <footer class="evolv-footer">
            <div class="evolv-footer-inner">
                <p class="evolv-footer-return">
                    Items can be returned within 30 days of purchase.
                    <button
                        class="evolv-footer-return-button"
                        aria-expanded="false"
                    >
                        Return policy
                        <span class="evolv-footer-return-tooltip">
                            <span class="evolv-footer-return-tooltip-inner"
                                >You may return or exchange wireless devices and
                                accessories purchased from Verizon Wireless
                                within 30 days of purchase. A restocking fee of
                                $50 applies to any return or exchange of a
                                wireless device (excluding Hawaii).</span
                            >
                        </span>
                    </button>
                </p>
                <p class="evolv-footer-clear">
                    Need to start over?
                    <button class="evolv-footer-clear-button">
                        Clear cart
                    </button>
                </p>
            </div>
        </footer>
    `);

    const returnButton = footer.find('.evolv-footer-return-button');

    returnButton.on('click', () => {
        let expanded = returnButton.attr('aria-expanded');
        expanded = expanded === 'true' ? 'false' : 'true';
        returnButton.attr({ 'aria-expanded': expanded });
    });

    document.body.addEventListener('click', (event) => {
        if (!event.target.matches('.evolv-footer-return-button')) {
            returnButton.attr({ 'aria-expanded': false });
        }
    });

    footer
        .find('button.evolv-footer-clear-button')
        .on('click', () =>
            $('#page a[data-testid="clear-cart"]').firstDom().click()
        );

    rule.whenItem('content-wrap').then((contentWrap) =>
        contentWrap.markOnce('evolv').append(footer)
    );
}

function start() {
    editHeading();
    makeButtonBar();
    editProducts();
    editDeviceProtection();
    makeTradeInSection();
    makePromoCarousel();
    editCartShipping();
    makeVerizonDollars();
    editOrderSummary();
    editPaymentInfo();
    editAccessoryInterstitial();
    editNextSteps();
    makeFooter();
}

extendRule(rule);
instrumentPage();

rule.app = { start };

// --- Variant
rule.track('1-1');
rule.app.start();
