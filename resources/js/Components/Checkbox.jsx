export default function Checkbox({ name, checked = false, onChange }) {
    return (
        <div className="relative inline-block">
        <input
            type="checkbox"
            name={name}
                checked={checked}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-white/20 bg-white/5 
                         transition-all duration-300 ease-in-out
                         checked:border-blue-500 checked:bg-blue-500 
                         hover:bg-white/10 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]
                         focus:outline-none focus:ring-0"
                onChange={onChange}
            />
            <svg
                className="pointer-events-none absolute left-[4px] top-[4px] h-3 w-3 
                         fill-none stroke-white stroke-[4] opacity-0 
                         transition-all duration-300 ease-in-out
                         peer-checked:opacity-100 peer-checked:scale-100 scale-50
                         peer-checked:rotate-0 -rotate-45"
                viewBox="0 0 24 24"
            >
                <path 
                    d="M5 13l4 4L19 7" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="origin-center"
                />
            </svg>
        </div>
    );
}
