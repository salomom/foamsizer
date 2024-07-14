import { useState } from 'react';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Sidebar from './components/sidebar';
import InsertSize from './components/insertSize';
import EditTools from './components/editTools';
import ScanImage from './components/scanImage';
import CoverCreator from './components/coverCreator';
import { FaArrowsLeftRightToLine } from "react-icons/fa6";


function Main() {
  const [activeTab, setActiveTab] = useState(3);
  const [currentPath, setCurrentPath] = useState('');
  const tabs = [
    {
      title: 'Scan',
      icon: <FaArrowsLeftRightToLine/>,
      element: <ScanImage currentPath={currentPath} setCurrentPath={setCurrentPath} />
    },
    {
      title: 'Insert Size',
      icon: <FaArrowsLeftRightToLine/>,
      element: <InsertSize currentPath={currentPath} setCurrentPath={setCurrentPath} />
    },
    {
      title: 'Edit Tools',
      icon: <FaArrowsLeftRightToLine/>,
      element: <EditTools currentPath={currentPath} setCurrentPath={setCurrentPath} />
    },
    {
      title: 'Create Cover',
      icon: <FaArrowsLeftRightToLine/>,
      element: <CoverCreator currentPath={currentPath} setCurrentPath={setCurrentPath} />
    }
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
