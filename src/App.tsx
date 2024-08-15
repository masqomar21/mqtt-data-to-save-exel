import { useState, useEffect } from "react";
import mqtt, { IClientOptions, MqttClient } from "mqtt";
import * as XLSX from "xlsx";

import { Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


interface MqttMessage {
    timestamp: string;
    fsr1value: string;
    fsr2value: string;
    pitch: string;
    servoAngle: string;
  }

  const options  = {
    host: "broker.hivemq.com",
    port: 8884,
    path: "/mqtt",
    protocol: "wss",
};


function App() {
    const [client, setClient] = useState<MqttClient | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [messages, setMessages] = useState<MqttMessage[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("data");

    const [chartData, setChartData] = useState({
        labels: [] as string[],
        datasets: [
          {
            label: 'FSR1 Value',
            data: [] as number[],
            borderColor: 'rgba(75,192,192,1)',
            fill: false,
          },
          {
            label: 'FSR2 Value',
            data: [] as number[],
            borderColor: 'rgba(153,102,255,1)',
            fill: false,
          },
          {
            label: 'Pitch',
            data: [] as number[],
            borderColor: 'rgba(255,159,64,1)',
            fill: false,
          },
          {
            label: 'Servo Angle',
            data: [] as number[],
            borderColor: 'rgba(255,99,132,1)',
            fill: false,
          }
        ]
      });

    const mqttTopic = "esp32/affoData";
    const mqttControlTopic = "esp32/control"; // New topic for controlling ESP
    // const mqttServer = "mqtt://broker.hivemq.com"; // WebSocket MQTT
  
    useEffect(() => {
      if (isRunning) {
        const newClient = mqtt.connect(options as IClientOptions);
  
        newClient.on("connect", () => {
          console.log("Connected to MQTT Broker");
          setIsConnected(true);
          newClient.subscribe(mqttTopic);
        });
  
        newClient.on("message", (topic: string, message: Buffer) => {
          if (topic === mqttTopic) {
            const payload = message.toString();
            const data = payload.split(",");
            const timestamp = new Date().toLocaleString();
            const rowData: MqttMessage = {
              timestamp,
              fsr1value: data[0],
              fsr2value: data[1],
              pitch: data[2],
              servoAngle: data[3],
            };
            setMessages((prevMessages) => [...prevMessages, rowData]);

            // Update chart data
            setChartData((prevData) => {
                const newLabels = [...prevData.labels, timestamp];
                const newFSR1Data = [...prevData.datasets[0].data, parseFloat(data[0])];
                const newFSR2Data = [...prevData.datasets[1].data, parseFloat(data[1])];
                const newPitchData = [...prevData.datasets[2].data, parseFloat(data[2])];
                const newServoAngleData = [...prevData.datasets[3].data, parseFloat(data[3])];
                return {
                  labels: newLabels.slice(-10), // Keep only the last 10 timestamps
                  datasets: [
                    { ...prevData.datasets[0], data: newFSR1Data.slice(-10) },
                    { ...prevData.datasets[1], data: newFSR2Data.slice(-10) },
                    { ...prevData.datasets[2], data: newPitchData.slice(-10) },
                    { ...prevData.datasets[3], data: newServoAngleData.slice(-10) },
                  ]
                };
              });
          }
        });
  
        newClient.on("error", (err: Error) => {
          console.error("Connection error: ", err);
        });
  
        setClient(newClient);
  
        return () => {
          if (newClient) {
            newClient.end();
          }
        };
      }
    }, [isRunning]);
  
    const handleStart = () => {
      setIsRunning(true);
      if (client) {
        client.publish(mqttControlTopic, "START"); // Send start command to ESP32
      }
    };
  
    const handleStop = () => {
      setIsRunning(false);
      if (client) {
        client.publish(mqttControlTopic, "STOP"); // Send stop command to ESP32
      }
    };

    const handleClearMessages = () => {
        setMessages([]); // Clear all messages
        setChartData({
            labels: [],
            datasets: [
              { label: 'FSR1 Value', data: [], borderColor: 'rgba(75,192,192,1)', fill: false },
              { label: 'FSR2 Value', data: [], borderColor: 'rgba(153,102,255,1)', fill: false },
              { label: 'Pitch', data: [], borderColor: 'rgba(255,159,64,1)', fill: false },
              { label: 'Servo Angle', data: [], borderColor: 'rgba(255,99,132,1)', fill: false }
            ]
          });
      };
  
    const handleSaveToExcel = () => {
      if (messages.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(messages);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
        // Save the Excel file with the given filename
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
      } else {
        alert("No data to save!");
      }
    };
  
  return (
    <div style={{ padding: "20px" }}>
    <h2>MQTT Data to Excel</h2>

    {/* Input for Excel file name */}
    <div>
      <label>Excel File Name: </label>
      <input
        type="text"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="Enter file name"
      />
    </div>

    <div style={{ marginTop: "20px" }}>
      {/* Button to start communication */}
      <button onClick={handleStart} disabled={isRunning}>
        Start
      </button>

      {/* Button to stop communication */}
      <button onClick={handleStop} disabled={!isRunning}>
        Stop
      </button>

      {/* Button to save data to Excel */}
      <button onClick={handleSaveToExcel} disabled={messages.length === 0 || isRunning}>
        Save to Excel
      </button>

        {/* Button to clear all messages */}
      <button onClick={handleClearMessages} disabled={messages.length === 0 || isRunning}>
        Clear Data
      </button>
    </div>

    <div style={{ marginTop: "20px" }}>
      {/* Display connection status */}
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>

      {/* Real-time chart */}
    <div style={{ marginTop: "20px" }}>
        <h3>Real-time Data Chart</h3>
        <Line data={chartData} />
    </div>

      {/* Display received data */}
      <table border={1}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>FSR1 Value</th>
            <th>FSR2 Value</th>
            <th>Pitch</th>
            <th>Servo Angle</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg, index) => (
            <tr key={index}>
              <td>{msg.timestamp}</td>
              <td>{msg.fsr1value}</td>
              <td>{msg.fsr2value}</td>
              <td>{msg.pitch}</td>
              <td>{msg.servoAngle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    
  </div>
  )
}

export default App
