import { forwardRef } from 'react';

const Input = forwardRef(({ type = 'text', className = '', children, ...props }, ref) => {
    return (
        <div>
            {type === 'select' ? (
                <select
                    {...props}
                    className={
                        'border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm ' +
                        className
                    }
                    ref={ref}
                >
                    {children}
                </select>
            ) : (
                <input
                    {...props}
                    type={type}
                    className={
                        'border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm ' +
                        className
                    }
                    ref={ref}
                />
            )}
        </div>
    );
});

export default Input; 