import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/home/Home";
import BulkExport from "./components/bulk/BulkData";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bulk" element={<BulkExport />} />
      </Routes>
    </div>
  );
}

export default App;
