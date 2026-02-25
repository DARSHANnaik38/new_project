import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BusMap from "./components/BusMap";
import LandingPage from "./components/LandingPage";

function App() {
  const [view, setView] = useState("landing"); // 'landing' | 'map'

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <LandingPage onEnter={() => setView("map")} />
          </motion.div>
        ) : (
          <motion.div
            key="map"
            style={{ width: "100vw", height: "100vh" }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <BusMap />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
