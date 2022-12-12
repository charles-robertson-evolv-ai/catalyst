function initializeLogs(sandbox) {
    // Uses console.info() because VBG blocks console.log();

    const environmentLogDefaults = {
        // VCG
        b02d16aa80: 'silent', // Prod
        add8459f1c: 'normal', // Staging
        '55e68a2ba9': 'normal', // Development
        eee20e49ae: 'normal', // Prototype
        b5d276c11b: 'normal', // verizon qa

        // VBG
        '13d2e2d4fb': 'silent', // Prod
        '4271e3bfc8': 'normal', // QA Testing
        '6bfb40849e': 'normal', // UAT
    };

    const participantsURL = document.querySelector(
        'script[src^="https://participants.evolv.ai"]'
    );
    const environmentMatch = participantsURL
        ? participantsURL
              .getAttribute('src')
              .match(
                  /(?<=https:\/\/participants\.evolv\.ai\/v1\/)[a-z0-9]*(?=\/)/
              )
        : null;
    let environmentId = environmentMatch ? environmentMatch[0] : null;
    const environmentLogs = environmentId
        ? environmentLogDefaults[environmentId]
        : null;
    const localStorageItem = localStorage.getItem('evolv:catalyst-logs');
    const localStorageMatch = localStorageItem
        ? localStorageItem.match(/silent|normal|debug/i)
        : null;
    const localStorageLogs = localStorageMatch ? localStorageMatch[0] : null;

    if (environmentLogs === 'silent') {
        sandbox.logs = localStorageLogs || 'silent';
    } else {
        sandbox.logs = localStorageLogs || sandbox.logs || 'normal';
    }

    sandbox.logColor = localStorageItem
        ? localStorageItem.includes('color')
        : null;

    const logPrefix = `[evolv-${sandbox.name}]`;
    const logPrefixColor = [
        `%c${logPrefix}`,
        'background-color: rgba(255, 122, 65, .5); border: 1px solid rgba(255, 122, 65, 1); border-radius: 2px',
    ];
    const debugPrefixColor = [
        `%c${logPrefix}`,
        'background-color: rgba(255, 122, 65, .25); border: 1px solid rgba(255, 122, 65, .5); border-radius: 2px',
    ];

    sandbox.log = (...args) => {
        const logs = sandbox.logs;
        if (logs === 'normal' || logs === 'debug') {
            if (sandbox.logColor) console.info(...logPrefixColor, ...args);
            else console.info(logPrefix, ...args);
        }
    };
    sandbox.warn = (...args) => {
        const logs = sandbox.logs;
        if (logs === 'normal' || logs === 'debug') {
            if (sandbox.logColor) console.warn(...logPrefixColor, ...args);
            else console.info(logPrefix, ...args);
        }
    };
    sandbox.debug = (...args) => {
        if (sandbox.logs === 'debug') {
            if (sandbox.logColor) console.info(...debugPrefixColor, ...args);
            else console.info(logPrefix, ...args);
        }
    };
}

export { initializeLogs };
