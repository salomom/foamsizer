import React from "react";
export default function Sidebar({ tabs, activeTab = 0, setActiveTab}) {
  return (
    <div className="w-36 h-screen bg-slate-700 border-r-black border-r">
      {tabs.map((tab, index) => (
        <SidebarButton
          key={index}
          active={activeTab === index}
          title={tab.title}
          icon={tab.icon}
          onClick={() => setActiveTab(index)}
        />
      ))}
    </div>
  );
}

function SidebarButton({ active = false, title = '', icon = '', onClick = () => {}}) {

  return (
    <div className="">
      <button
        className={(active ? 'bg-indigo-700' : 'bg-indigo-500') + ' text-center text-white font-bold rounded-md h-auto w-full py-4'}
        onClick={onClick}
      >
        {React.cloneElement(icon, { className: 'w-[60%] h-full m-auto px-4' })}
        {title}
      </button>
    </div>
  );
}
