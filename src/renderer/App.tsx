import { useState } from 'react';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Sidebar from './components/sidebar';
import InsertSize from './components/insertSize';
import ScanImage from './components/scanImage';
import { FaArrowsLeftRightToLine } from "react-icons/fa6";


function Main() {
  const [activeTab, setActiveTab] = useState(0);
  const [currentPath, setCurrentPath] = useState('');
  const tabs = [
    {
      title: 'Scan',
      icon: <FaArrowsLeftRightToLine/>,
      element:<ScanImage currentPath={currentPath}/>
    },
    {
      title: 'Insert Size',
      icon: <FaArrowsLeftRightToLine/>,
      element:<InsertSize currentPath={currentPath} setCurrentPath={setCurrentPath} />
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
