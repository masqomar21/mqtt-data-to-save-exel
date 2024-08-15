import { useState, useEffect } from "react";
import mqtt, { IClientOptions, MqttClient } from "mqtt";
import * as XLSX from "xlsx";

import { Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MqttMessage {
    [key: string]: string; // Make the message structure dynamic
}

function App() {
    const [client, setClient] = useState<MqttClient | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [messages, setMessages] = useState<MqttMessage[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("data");

    const [host, setHost] = useState<string>("broker.hivemq.com");
    const [port, setPort] = useState<number>(8884);
    const [protocol, setProtocol] = useState<string>("wss");
    const [topic, setTopic] = useState<string>("esp32/topik");
    const [controlTopic, setControlTopic] = useState<string>("esp32/control");
    const [columns, setColumns] = useState<string[]>(["data1, data2"]);

    const [chartData, setChartData] = useState({
        labels: [] as string[],
        datasets: columns.map((col, index) => ({
            label: col,
            data: [] as number[],
            borderColor: `rgba(${(index * 60) % 255}, ${(index * 120) % 255}, ${(index * 240) % 255}, 1)`,
            fill: false,
        })),
    });

    const options = {
        host,
        port,
        protocol,
        path: "/mqtt",
    };

    useEffect(() => {
        if (isRunning) {
            const newClient = mqtt.connect(options as IClientOptions);

            newClient.on("connect", () => {
                console.log("Connected to MQTT Broker");
                setIsConnected(true);
                newClient.subscribe(topic);
            });

            newClient.on("message", (receivedTopic: string, message: Buffer) => {
                if (receivedTopic === topic) {
                    const payload = message.toString();
                    const data = payload.split(",");
                    const timestamp = new Date().toLocaleString();

                    const rowData: MqttMessage = {
                        timestamp,
                        ...columns.reduce((acc, col, index) => {
                            acc[col] = data[index];
                            return acc;
                        }, {} as MqttMessage),
                    };

                    setMessages((prevMessages) => [...prevMessages, rowData]);

                    // Update chart data
                    setChartData((prevData) => {
                        const newLabels = [...prevData.labels, timestamp];
                        const newDatasets = prevData.datasets.map((dataset, index) => ({
                            ...dataset,
                            data: [...dataset.data, parseFloat(data[index])].slice(-10),
                        }));

                        return {
                            labels: newLabels.slice(-10),
                            datasets: newDatasets,
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
    }, [isRunning, topic, columns]);

    useEffect(() => {
        setChartData({
            labels: [],
            datasets: columns.map((col, index) => ({
                label: col,
                data: [] as number[],
                borderColor: `rgba(${(index * 60) % 255}, ${(index * 120) % 255}, ${(index * 240) % 255}, 1)`,
                fill: false,
            })),
        });
    }, [columns]);

    const handleStart = () => {
        setIsRunning(true);
        if (client) {
            client.publish(controlTopic, "START");
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        if (client) {
            client.publish(controlTopic, "STOP");
        }
    };

    const handleClearMessages = () => {
        setMessages([]);
        setChartData({
            labels: [],
            datasets: columns.map((col, index) => ({
                label: col,
                data: [],
                borderColor: `rgba(${(index * 60) % 255}, ${(index * 120) % 255}, ${(index * 240) % 255}, 1)`,
                fill: false,
            })),
        });
    };

    const handleSaveToExcel = () => {
        if (messages.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(messages);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else {
            alert("No data to save!");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>MQTT Data to Excel</h2>

            <div>
                <label>Host: </label>
                <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="Enter MQTT host" />
            </div>

            <div>
                <label>Port: </label>
                <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} placeholder="Enter port" />
            </div>

            <div>
                <label>Protocol: </label>
                <input type="text" value={protocol} onChange={(e) => setProtocol(e.target.value)} placeholder="Enter protocol" />
            </div>

            <div>
                <label>Topic: </label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter topic" />
            </div>

            <div>
                <label>Control Topic: </label>
                <input type="text" value={controlTopic} onChange={(e) => setControlTopic(e.target.value)} placeholder="Enter control topic" />
            </div>

            <div>
                <label>Data Columns (comma separated): </label>
                <input type="text" value={columns.join(",")} onChange={(e) => setColumns(e.target.value.split(","))} placeholder="Enter data columns" />
            </div>

            <div>
                <label>Excel File Name: </label>
                <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Enter file name" />
            </div>

            <div style={{ marginTop: "20px" }}>
                <button onClick={handleStart} disabled={isRunning}>Start</button>
                <button onClick={handleStop} disabled={!isRunning}>Stop</button>
                <button onClick={handleSaveToExcel} disabled={messages.length === 0 || isRunning}>Save to Excel</button>
                <button onClick={handleClearMessages} disabled={messages.length === 0 || isRunning}>Clear Data</button>
            </div>

            <div style={{ marginTop: "20px" }}>
                <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
                <div style={{ marginTop: "20px" }}>
                    <h3>Real-time Data Chart</h3>
                    <Line data={chartData} />
                </div>
                <table border={1}>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            {columns.map((col) => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map((msg, index) => (
                            <tr key={index}>
                                <td>{msg.timestamp}</td>
                                {columns.map((col) => (
                                    <td key={col}>{msg[col]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default App;
