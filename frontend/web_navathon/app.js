const STORAGE_KEY = 'panel-opciones';
const MINUTO_MS = 60000;
const HORA_MS = 3600000;
const SIN_DATOS = ['Sin datos', 'mute'];
const SENSORES_DE_NIVEL = new Set(['dust', 'gas']);

const RANGOS_SIMULACION = {
  temp: { paso: 0.4, min: 10, max: 46 },
  hum: { paso: 1.5, min: 20, max: 90 },
  pres: { paso: 0.05, min: 990, max: 1030 },
  dust: { paso: 20, min: 0, max: 400 },
  gas: { paso: 120, min: 50, max: 2500 }
};

const opciones = { modo: 'sim', url: '' };
const manual = { temp: 24.6 };
const simulado = { temp: 24.6, hum: 58, pres: 1013.2, dust: 30, gas: 150 };
const historial = Object.fromEntries(Object.keys(SENSORES).map(k => [k, []]));

try {
  Object.assign(opciones, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
} catch {}

const guardarOpciones = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opciones));
  } catch {}
};

const $ = id => document.getElementById(id);

const formatear = (valor, decimales) =>
  isNaN(valor) ? '—' : valor.toFixed(decimales).replace('.', ',');

const ultimoValor = clave => {
  const datos = historial[clave];
  return datos.length ? datos[datos.length - 1].v : NaN;
};

function clasificar(valor, config) {
  if (isNaN(valor)) return SIN_DATOS;
  if (valor > config.precaucionMax) return ['Peligroso', 'bad'];
  if (valor < config.normal[0] || valor > config.normal[1]) return ['Precaución', 'warn'];
  return ['Normal', 'ok'];
}

function variacionPresion(minutos) {
  const puntos = historial.pres.filter(p => !isNaN(p.v));
  if (!puntos.length) return { dif: NaN, span: 0 };

  const desde = puntos[puntos.length - 1].t - minutos * MINUTO_MS;
  const ventana = puntos.filter(p => p.t >= desde);
  if (ventana.length < 2) return { dif: NaN, span: 0 };

  const primero = ventana[0];
  const ultimo = ventana[ventana.length - 1];
  return { dif: ultimo.v - primero.v, span: ultimo.t - primero.t };
}

function estadoPresion() {
  const cambioCorto = variacionPresion(PRESION.ventanaMin).dif;
  if (isNaN(cambioCorto)) return SIN_DATOS;
  if (Math.abs(cambioCorto) > PRESION.peligro) return ['Peligroso', 'bad'];
  if (Math.abs(cambioCorto) >= PRESION.precaucion) return ['Precaución', 'warn'];

  const largo = variacionPresion(60);
  const cambioPorHora = Math.abs(largo.dif) / (largo.span / HORA_MS);
  if (largo.span >= 30 * MINUTO_MS && cambioPorHora >= PRESION.horaMax) {
    return ['Precaución', 'warn'];
  }
  return ['Normal', 'ok'];
}

const ESTADO = {
  temp: v => clasificar(v, SENSORES.temp),
  hum: v => clasificar(v, SENSORES.hum),
  dust: v => clasificar(v, SENSORES.dust),
  gas: v => clasificar(v, SENSORES.gas),
  pres: estadoPresion
};

const SUBTEXTO = {
  temp: () => '',
  hum: () => '',
  pres: v => {
    const altitud = 44330 * (1 - Math.pow(v / P0, 0.1903));
    const cambio = variacionPresion(PRESION.ventanaMin).dif;
    return `Cambio en ${PRESION.ventanaMin} min: ${formatear(cambio, 1)} hPa · Altitud est.: ${formatear(altitud, 0)} m`;
  },
  dust: () => 'Estimación óptica, no medidor certificado de PM2.5',
  gas: v => `Equivale al ${formatear((v / ADC_MAX) * 100, 0)} % del rango ADC · sin calibración no se muestran ppm`
};

$('grid').innerHTML = Object.entries(SENSORES)
  .map(([k, m]) => `
    <article class="card">
      <div class="top">
        <div><b>${m.titulo}</b> <span class="muted">${m.sensor}</span></div>
        <span class="badge" id="b-${k}"></span>
      </div>
      <div class="big" id="v-${k}"></div>
      <div class="muted" id="t-${k}"></div>
      <div class="muted" id="s-${k}"></div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none"><polyline id="g-${k}"/></svg>
    </article>`)
  .join('');

const elementos = Object.fromEntries(
  Object.keys(SENSORES).map(k => [k, {
    valor: $('v-' + k),
    badge: $('b-' + k),
    tendencia: $('t-' + k),
    sub: $('s-' + k),
    grafico: $('g-' + k)
  }])
);

function puntosGrafico(clave) {
  const puntos = historial[clave]
    .slice(-PUNTOS_GRAFICO)
    .map((p, i) => [i, p.v])
    .filter(p => !isNaN(p[1]));
  if (puntos.length < 2) return '';

  const valores = puntos.map(p => p[1]);
  const min = Math.min(...valores);
  const rango = Math.max(...valores) - min || 1;

  return puntos
    .map(([i, v]) => {
      const x = (i / (PUNTOS_GRAFICO - 1)) * 100;
      const y = 36 - ((v - min) / rango) * 32;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function textoTendencia(clave, config) {
  const datos = historial[clave].slice(-VENTANA_TENDENCIA).filter(p => !isNaN(p.v));
  if (datos.length < 2) return 'Tendencia: recopilando datos…';

  const primero = datos[0];
  const ultimo = datos[datos.length - 1];
  const dif = ultimo.v - primero.v;
  const estado = Math.abs(dif) < config.umbralTend ? 'Estable' : dif > 0 ? 'Subiendo' : 'Bajando';
  const flecha = dif > 0 ? '↑' : dif < 0 ? '↓' : '→';
  const signo = dif > 0 ? '+' : '';
  const minutos = Math.max(0.1, (ultimo.t - primero.t) / MINUTO_MS).toFixed(1).replace('.', ',');

  return `${flecha} ${estado} (${signo}${formatear(dif, config.dec)} ${config.unidad} en ${minutos} min)`;
}

function dibujar() {
  for (const [clave, config] of Object.entries(SENSORES)) {
    const el = elementos[clave];
    const valor = ultimoValor(clave);
    const [etiqueta, clase] = ESTADO[clave](valor);
    const esNivel = SENSORES_DE_NIVEL.has(clave);

    el.valor.innerHTML = esNivel ? etiqueta : `${formatear(valor, config.dec)}<small>${config.unidad}</small>`;
    el.valor.className = 'big ' + (esNivel ? clase : '');
    el.badge.textContent = config.etiqueta || etiqueta;
    el.badge.className = 'badge ' + (config.etiqueta ? 'mute' : clase);
    el.tendencia.textContent = textoTendencia(clave, config);
    el.sub.textContent = isNaN(valor) ? '' : SUBTEXTO[clave](valor);
    el.grafico.setAttribute('points', puntosGrafico(clave));
  }
  $('hora').textContent = 'Última lectura: ' + new Date().toLocaleTimeString('es-AR');
}

function simular() {
  for (const [clave, { paso, min, max }] of Object.entries(RANGOS_SIMULACION)) {
    const siguiente = simulado[clave] + (Math.random() - 0.5) * paso;
    simulado[clave] = Math.min(max, Math.max(min, siguiente));
  }
  return { ...simulado };
}


async function leerDatos() {
  if (opciones.modo === 'url') {
    if (!opciones.url.trim()) {
      throw new Error('Falta configurar la URL de la API.');
    }

    const respuesta = await fetch(opciones.url);

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }

    const registro = await respuesta.json();

    // Adaptamos el modelo de la API al que usa el frontend.
    const mediciones = registro.data ?? registro;

    return {
      temp: mediciones.temperature ?? mediciones.temperatura,
      hum: mediciones.humidity ?? mediciones.humedad,
      pres: mediciones.pressure ?? mediciones.presion,
      dust: mediciones.pm2_5 ?? mediciones.polvoPorMetroCubico,
      gas: mediciones.gas_concentration ?? mediciones.gases
    };
  }

  const datos = simular();

  if (opciones.modo === 'man') {
    datos.temp = manual.temp;
  }

  return datos;
}


async function actualizar() {
  let datos;
  try {
    datos = await leerDatos();
  } catch {
    datos = {};
  }

  const ahora = Date.now();
  for (const clave in historial) {
    const crudo = datos[clave];
    const serie = historial[clave];
    serie.push({ t: ahora, v: crudo == null || crudo === '' ? NaN : Number(crudo) });
    while (serie.length && ahora - serie[0].t > HISTORIAL_MS) serie.shift();
  }
  dibujar();
}

let temporizador;
function iniciar() {
  clearInterval(temporizador);
  temporizador = setInterval(actualizar, INTERVALO_MS);
  actualizar();
}

function aplicarModo() {
  $('modo').value = opciones.modo;
  $('bloqueMan').hidden = opciones.modo !== 'man';
  $('bloqueUrl').hidden = opciones.modo !== 'url';
}

$('modo').onchange = e => {
  opciones.modo = e.target.value;
  guardarOpciones();
  aplicarModo();
};

$('url').value = opciones.url;
$('url').oninput = e => {
  opciones.url = e.target.value;
  guardarOpciones();
};

$('m-temp').value = manual.temp;
$('m-temp').oninput = e => {
  manual.temp = e.target.value === '' ? NaN : parseFloat(e.target.value);
};

aplicarModo();
iniciar();
