import { forwardRef, useEffect, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref
) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <input
            {...props}
            type={type}
            className={
                'mt-1 block w-full bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/50 focus:ring-white/50 rounded-lg shadow-sm transition-all duration-300 ' +
                className
            }
            ref={input}
        />
    );
});
