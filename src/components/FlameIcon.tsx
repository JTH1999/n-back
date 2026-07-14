import clsx from 'clsx'

export interface FlameIconProps {
  filled: boolean
  className?: string
}

export function FlameIcon({ filled, className }: FlameIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      className={clsx('h-6 w-6 text-accent', className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      {filled ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177A7.547 7.547 0 0 1 6.648 6.61a.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1.005a.75.75 0 0 0 .933-.933 6.752 6.752 0 0 1-.005-4.049 3.752 3.752 0 0 1 4.252 5.15Z"
        />
      ) : (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12.75 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12.75 18Z"
          />
        </>
      )}
    </svg>
  )
}
