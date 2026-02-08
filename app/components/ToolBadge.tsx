'use client';

interface ToolBadgeProps {
  name: string;
  icon?: string;
  onRemove?: () => void;
}

export default function ToolBadge({ name, icon, onRemove }: ToolBadgeProps) {
  return (
    <span
      className="
        inline-flex items-center gap-1.5 px-2.5 py-1
        bg-gradient-to-r from-blue-500 to-purple-600
        text-white text-xs font-medium
        rounded-full
        transition-all duration-200
        hover:shadow-md
      "
    >
      {icon && <span className="text-sm">{icon}</span>}
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="
            ml-0.5 w-4 h-4
            flex items-center justify-center
            rounded-full
            hover:bg-white/20
            transition-colors duration-150
          "
          aria-label={`移除 ${name}`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
