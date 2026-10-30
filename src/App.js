import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Homepage from "./pages/homepage";
import Notfound from "./pages/404";

import { TRACKING_ID } from "./data/tracking";
import "./app.css";

function App() {
	useEffect(() => {
		if (TRACKING_ID === "") return undefined;
		let cancelled = false;
		import("react-ga4").then((mod) => {
			if (!cancelled) mod.default.initialize(TRACKING_ID);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="App">
			<Routes>
				<Route path="/" element={<Homepage />} />
				<Route path="*" element={<Notfound />} />
			</Routes>
		</div>
	);
}

export default App;
