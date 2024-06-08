import { useState } from 'react';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Sidebar from './components/sidebar';
import InsertSize from './components/insertSize';
import { FaArrowsLeftRightToLine } from "react-icons/fa6";


function Main() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    {
      title: 'Insert Size',
      icon: <FaArrowsLeftRightToLine/>,
      element:<InsertSize/>
    },
  ];
  return (
    <div className="flex bg-slate-900">
      <Sidebar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      {tabs[activeTab].element}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
