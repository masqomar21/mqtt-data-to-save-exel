# React + TypeScript + Vite + MQTT + Exel

## Decskription

This is a simple project that uses React, TypeScript, Vite, MQTT and Exel to create a simple web application that can send and receive messages from a MQTT broker.

## Clone & Installation

```bash
git clone https://github.com/masqomar21/mqtt-data-to-save-exel.git
```

```bash
cd mqtt-data-to-save-exel
```

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Features

- [x] React
- [x] TypeScript
- [x] Vite
- [x] MQTT
- [x] Exel
- [x] chart.js
- [x] react-chartjs-2

## Configuration

### MQTT

```javascript
// src/app.ts

// adjust the options object to match your MQTT broker
const options = {
	host: 'broker.hivemq.com',
	port: 8000,
	path: '/mqtt'
	// protocol: 'wss'
}
```

```javascript
// src/app.ts

// adjust the topic to match your MQTT topic
const mqttTopic = 'esp32/affoData'
const mqttControlTopic = 'esp32/control'
```

### Data

```javascript
// src/app.ts

// adjust the data as needed
interface MqttMessage {
    timestamp: string;
    fsr1value: string;
    fsr2value: string;
    pitch: string;
    servoAngle: string;
}
  ...

const rowData: MqttMessage = {
    timestamp,
    fsr1value: data[0],
    fsr2value: data[1],
    pitch: data[2],
    servoAngle: data[3],
}
```

### Data Payload

```bash
// fsr1value,fsr2value,pitch,servoAngle
'300,250,12.40,62'
```

### mqtt-Comand-line

```bash
// subscribe (use mosquitto)
mosquitto_sub -h broker.hivemq.com -p 8000 -t esp32/affoData
```

```bash
// publish (use mosquitto)
mosquitto_pub -h broker.hivemq.com -p 8000 -t esp32/control -m "300,250,12.40,62"
```

## author

- [masqomar21](https://github.com/masqomar21)

<!-- This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
	// other rules...
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		project: ['./tsconfig.json', './tsconfig.node.json'],
		tsconfigRootDir: __dirname
	}
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list -->
