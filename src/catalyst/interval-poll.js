function initializeIntervalPoll(catalyst) {
    function processQueue(sandbox) {
        const queue = sandbox._intervalPoll.queue;

        for (let i = 0; i < queue.length; i++) {
            const entry = queue[i];
            let timeElapsed = performance.now() - entry.startTime;

            if (entry.timeout && entry.timeout < timeElapsed) {
                sandbox.debug('waitUntil: condition timed out', entry);
                queue.splice(i, 1);
                continue;
            }

            try {
                if (entry.condition()) {
                    sandbox.debug(
                        'waitUntil: condition met:',
                        entry.condition,
                        entry.condition(),
                        `${(performance.now() - entry.startTime).toFixed(2)}ms`
                    );
                    entry.callback();
                    queue.splice(i, 1);
                }
            } catch (error) {
                // Prevents 60 error messages per second if the condition contains an error
                sandbox.warn(
                    'waitUntil: error in condition, removing from queue',
                    error
                );
                queue.splice(i, 1);
            }
        }
    }

    function processQueues() {
        return new Promise((resolve) => {
            const processQueuesLoop = () => {
                let anySandboxActive = false;
                let queueTotal = 0;

                for (const sandbox of catalyst.sandboxes) {
                    if (sandbox._evolvContext.state.current === 'inactive')
                        continue;
                    anySandboxActive = true;

                    processQueue(sandbox);
                    queueTotal += sandbox._intervalPoll.queue.length;
                }

                if (!anySandboxActive) {
                    catalyst.debug('interval poll: no active sandboxes');
                    return resolve(false);
                } else if (queueTotal === 0) {
                    catalyst.debug('interval poll: all queues empty');
                    return resolve(false);
                } else {
                    requestAnimationFrame(processQueuesLoop);
                }
            };
            processQueuesLoop();
        });
    }

    return {
        isPolling: false,
        startPolling: async function () {
            const intervalPoll = catalyst._intervalPoll;
            if (intervalPoll.isPolling) return;
            catalyst.debug('interval poll: start polling');
            intervalPoll.isPolling = true;
            intervalPoll.isPolling = await processQueues();
            catalyst.debug('interval poll: stop polling');
        },
    };
}

function initializeSandboxIntervalPoll(sandbox) {
    return {
        queue: [],
        reset: () => {
            if (sandbox._intervalPoll.queue.length > 0) {
                sandbox.debug('interval poll: clear queue');
                sandbox._intervalPoll.queue = [];
            }
        },
    };
}

export { initializeIntervalPoll, initializeSandboxIntervalPoll };
