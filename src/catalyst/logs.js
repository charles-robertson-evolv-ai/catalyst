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

function initializeLogs(sandbox) {
    // Uses console.info() because VBG blocks console.log();

    const logPrefix = `[evolv-${sandbox.name}]`;

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

    const localStorageLogs = localStorage.getItem('evolv:catalyst-logs');
    sandbox.logs = sandbox.logs || 'normal';
    if (environmentLogs) sandbox.logs = environmentLogs;
    if (localStorageLogs) sandbox.logs = localStorageLogs;

    sandbox.log = (...args) => {
        const logs = sandbox.logs;
        if (logs === 'normal' || logs === 'debug')
            console.info(logPrefix, ...args);
    };
    sandbox.warn = (...args) => {
        const logs = sandbox.logs;
        if (logs === 'normal' || logs === 'debug')
            console.warn(logPrefix, ...args);
    };
    sandbox.debug = (...args) => {
        if (sandbox.logs === 'debug') console.info(`${logPrefix}`, ...args);
    };
}

export { initializeLogs };
