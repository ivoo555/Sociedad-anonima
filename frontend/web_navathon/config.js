const INTERVALO_MS = 750;
const P0 = 1013.25;
const ADC_MAX = 4095;

const VENTANA_TENDENCIA = 30;
const PUNTOS_GRAFICO = 60;
const HISTORIAL_MS = 60 * 60 * 1000;

const SENSORES = {
  temp: {
    titulo: 'Temperatura',
    sensor: 'DHT22',
    unidad: '°C',
    dec: 1,
    umbralTend: 0.3,
    normal: [15, 35],
    precaucionMax: 44
  },
  hum: {
    titulo: 'Humedad relativa',
    sensor: 'DHT22',
    unidad: '% HR',
    dec: 0,
    umbralTend: 1,
    normal: [30, 70],
    precaucionMax: 84
  },
  pres: {
    titulo: 'Presión barométrica',
    sensor: 'GY-BMP',
    unidad: 'hPa',
    dec: 1,
    umbralTend: 0.5
  },
  dust: {
    titulo: 'Polvo',
    sensor: 'GP2Y1010AU0F',
    unidad: 'µg/m³',
    dec: 0,
    umbralTend: 5,
    normal: [0, 50],
    precaucionMax: 300,
    etiqueta: 'Valor estimado'
  },
  gas: {
    titulo: 'Gas',
    sensor: 'FC-22',
    unidad: 'ADC',
    dec: 0,
    umbralTend: 50,
    normal: [0, 800],
    precaucionMax: 2000,
    etiqueta: 'Señal indirecta'
  }
};

const PRESION = {
  horaMax: 2,
  ventanaMin: 5,
  precaucion: 3,
  peligro: 10
};

const ALERTAS = {
  frioMax: 5,
  humSecaMax: 50
};

const API = "https://localhost:5001";

async function cargarEstado() {
  const res = await fetch(`${API}/api/v1/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const registro = await res.json();

  console.log(registro.alert_level, registro.data.temperature);
}

async function enviarRegistro(registro) {
  const res = await fetch(`${API}/api/v1/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registro),
  });
  return res.status;
}
