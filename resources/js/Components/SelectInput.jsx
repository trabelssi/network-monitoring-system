import { forwardRef } from 'react';
import Input from '@/Components/Input';

const SelectInput = forwardRef(({ className = '', children, ...props }, ref) => {
    return (
        <Input
            {...props}
            type="select"
            className={
                'border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm ' +
                className
            }
            ref={ref}
        >
            {children}
        </Input>
    );
});

export default SelectInput; 