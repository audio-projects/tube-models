export const processOptions = (options: Record<string, unknown>, defaults: Record<string, unknown> | undefined) => {
    // result
    const result: Record<string, unknown> = {};
    // process defaults if any
    if (defaults) {
        // copy over result
        for (const option in defaults)
            result[option] = defaults[option];
    }
    // process options if any (override defaults)
    if (options) {
        // copy over result
        for (const o in options)
            result[o] = options[o];
    }
    return result;
};
