import { useEffect, useState } from "react";
import { healthCheck } from "./shared/api/client";

function App() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    healthCheck()
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>Applied</h1>
      <p>API status: {status}</p>
    </main>
  );
}

export default App;
