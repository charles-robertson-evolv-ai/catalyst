function initializeStore(sandbox) {
    return {
        instrumentDOM: (data) => {
            const argumentArray = [];

            for (const key in data) {
                const dataItem = data[key];
                const select = Object.getOwnPropertyDescriptor(
                    dataItem,
                    'dom'
                ).get;
                const options = {};
                if (dataItem.hasOwnProperty('asClass'))
                    options.asClass = dataItem.asClass;

                argumentArray.push([key, select, options]);
            }

            sandbox.instrument.add(argumentArray);
        },
    };
}

export { initializeStore };
