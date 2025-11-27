import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import LeadDetails from './LeadDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads/:id" element={<LeadDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
