type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
  disabled?: boolean;
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded text-sm font-medium transition";

  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:underline",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
