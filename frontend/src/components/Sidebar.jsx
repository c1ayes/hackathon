const navItems = [
    {label: "Главная", active: true},
    {label: "Проишествия", active: false},
];

export default function Sidebar() {
  return (
    <aside className="w-44 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-900 leading-tight">
          Smart City<br />Dashboard
        </div>
        <div className="text-xs text-gray-400 mt-1">Алматы, 2026</div>
      </div>

      <nav className="flex flex-col gap-0.5 py-2">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 px-4 py-2 text-xs cursor-pointer transition-colors
              ${item.active
                ? "bg-gray-100 text-gray-900 font-medium border-l-2 border-blue-500"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                item.active ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}