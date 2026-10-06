"use client";

// A submit button for destructive <form action={...}> forms that asks for
// confirmation first.
export default function ConfirmSubmitButton({
  message,
  children,
  className = "text-xs font-semibold text-red-600 hover:underline",
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
