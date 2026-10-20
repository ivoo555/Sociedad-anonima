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
const VALORES_BASE = { temp: 24.6, hum: 58, pres: 1013.2, dust: 30, gas: 150 };
const manual = { ...VALORES_BASE };
const simulado = { ...VALORES_BASE };
const historial = Object.fromEntries(Object.keys(SENSORES).map(k => [k, []]));
let riesgosBackend = null;
let simulacionBackendActiva = false;
let umbralesBackend = null;
let errorCarga = null;

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
  const clave = Object.entries(SENSORES).find(([, sensor]) => sensor === config)?.[0];
  const riesgoBackendPorSensor = { temp: 'temperature', hum: 'humidity', pres: 'pressure', dust: 'pm2_5', gas: 'gas_concentration' };
  const riesgo = clave && riesgosBackend?.[riesgoBackendPorSensor[clave]];
  if (riesgo) return estadoDesdeBackend(riesgo);
  const t = clave && umbralesBackend?.[riesgoBackendPorSensor[clave]];
  if (t) {
    const nivel = t.higher_is_risk
      ? valor >= t.high ? 'high_risk' : valor >= t.mid ? 'mid_risk' : valor >= t.low ? 'low_risk' : 'normal'
      : valor <= t.high ? 'high_risk' : valor <= t.mid ? 'mid_risk' : valor <= t.low ? 'low_risk' : 'normal';
    return estadoDesdeBackend(nivel);
  }
  if (valor > config.precaucionMax) return ['Peligroso', 'bad'];
  if (valor < config.normal[0] || valor > config.normal[1]) return ['Precaución', 'warn'];
  return ['Normal', 'ok'];
}

function estadoDesdeBackend(riesgo) {
  const nivel = String(riesgo).toLowerCase().replaceAll('_', '');
  return ({ normal: ['Normal', 'ok'], lowrisk: ['Low', 'warn'], midrisk: ['Mid', 'warn'],
    highrisk: ['High', 'bad'], criticalrisk: ['Critical', 'bad'] })[nivel] || SIN_DATOS;
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
  if (riesgosBackend?.pressure) return estadoDesdeBackend(riesgosBackend.pressure);
  if (umbralesBackend?.pressure) return clasificar(ultimoValor('pres'), SENSORES.pres);
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
      <div class="fx fx-back" id="fxb-${k}" aria-hidden="true"></div>
      <div class="fx fx-front" id="fxf-${k}" aria-hidden="true"></div>
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

for (const k of Object.keys(SENSORES)) EFECTOS.iniciar(k, $('fxb-' + k), $('fxf-' + k));

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

function evaluarAlertas() {
  const claseDe = k => ESTADO[k](ultimoValor(k))[1];
  const fueraDeNormal = k => ['warn', 'bad'].includes(claseDe(k));

  const gasElevado = fueraDeNormal('gas');
  const polvoElevado = fueraDeNormal('dust');
  const grave = claseDe('gas') === 'bad' || claseDe('dust') === 'bad';

  const temp = ultimoValor('temp');
  const hum = ultimoValor('hum');
  const presionEstable = claseDe('pres') === 'ok';
  const nombre = k => ESTADO[k](ultimoValor(k))[0];
  const activas = [];

  if (gasElevado && polvoElevado) {
    activas.push({
      id: 'desgasificacion',
      clase: grave ? 'bad' : 'warn',
      titulo: 'Desgasificación activa con emisión de ceniza o partículas',
      texto: 'El nivel elevado y simultáneo de gas y polvo apunta a la liberación de gases volcánicos junto con material particulado fino o ceniza. Hay riesgo por toxicidad de la atmósfera y por menor visibilidad y calidad del aire.',
      datos: `Gas: ${formatear(ultimoValor('gas'), 0)} ADC (${nombre('gas')}) · Polvo: ${formatear(ultimoValor('dust'), 0)} µg/m³ (${nombre('dust')})`
    });
  }

  if (!isNaN(temp) && temp <= ALERTAS.frioMax && gasElevado && polvoElevado) {
    activas.push({
      id: 'inversion-termica',
      clase: 'bad',
      titulo: 'Estancamiento de gases y partículas por frío extremo (inversión térmica)',
      texto: 'Con aire frío y denso a nivel del suelo, los gases y el polvo elevados tienden a acumularse en zonas bajas o valles en lugar de dispersarse. Aumenta el peligro para la salud respiratoria de personas y equipos expuestos.',
      datos: `Temperatura: ${formatear(temp, 1)} °C (≤ ${ALERTAS.frioMax} °C) · Gas: ${nombre('gas')} · Polvo: ${nombre('dust')}`
    });
  }

  if (!isNaN(hum) && hum <= ALERTAS.humSecaMax && presionEstable && polvoElevado) {
    activas.push({
      id: 'pluma-seca',
      clase: 'warn',
      titulo: 'Propagación de pluma seca a distancia',
      texto: 'Con humedad baja y presión estable no hay lluvia inminente que lave la atmósfera. La pluma de ceniza y gas viajaría seca y más lejos, ampliando el radio afectado.',
      datos: `Humedad: ${formatear(hum, 0)} % HR (≤ ${ALERTAS.humSecaMax} %) · Presión: estable · Polvo: ${nombre('dust')}`
    });
  }

  return activas;
}

const alertasMostradas = new Map();
const ORDEN_SEVERIDAD = { bad: 0, warn: 1 };

function crearNodoAlerta() {
  const nodo = document.createElement('div');
  nodo.setAttribute('role', 'alert');
  for (const clase of ['titulo', 'texto', 'datos', 'estado']) {
    const el = document.createElement(clase === 'titulo' ? 'b' : clase === 'texto' ? 'p' : 'div');
    el.className = clase;
    nodo.append(el);
  }
  return nodo;
}

function dibujarAlertas() {
  const contenedor = $('alertas');
  const ahora = Date.now();
  const activas = evaluarAlertas();
  const ids = new Set(activas.map(a => a.id));

  for (const [id, e] of alertasMostradas) {
    if (!ids.has(id)) {
      e.nodo.remove();
      alertasMostradas.delete(id);
    }
  }

  for (const a of activas) {
    if (!alertasMostradas.has(a.id)) {
      alertasMostradas.set(a.id, { nodo: crearNodoAlerta(), desde: ahora });
    }
  }

  activas.sort((x, y) =>
    ORDEN_SEVERIDAD[x.clase] - ORDEN_SEVERIDAD[y.clase] ||
    alertasMostradas.get(x.id).desde - alertasMostradas.get(y.id).desde);

  for (const a of activas) {
    const { nodo, desde } = alertasMostradas.get(a.id);
    nodo.className = 'alerta ' + a.clase;
    nodo.querySelector('.titulo').textContent = a.titulo;
    nodo.querySelector('.texto').textContent = a.texto;
    nodo.querySelector('.datos').textContent = a.datos;
    nodo.querySelector('.estado').textContent = 'Activa desde las ' + new Date(desde).toLocaleTimeString('es-AR');
  }

  contenedor.append(...activas.map(a => alertasMostradas.get(a.id).nodo));
  contenedor.hidden = !activas.length;
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
    EFECTOS.actualizar(clave, valor, clase);
  }
  dibujarAlertas();
  $('hora').textContent = errorCarga
    ? `${errorCarga} · Reintentando…`
    : 'Última lectura: ' + new Date().toLocaleTimeString('es-AR');
}

async function verificarRespuesta(respuesta) {
  if (respuesta.ok) return;
  let detalle = `Error HTTP ${respuesta.status}`;
  try {
    const cuerpo = await respuesta.json();
    detalle = cuerpo.error || cuerpo.message || detalle;
  } catch {}
  throw new Error(detalle);
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

    const mediciones = registro.data ?? registro;

    return {
      temp: mediciones.temperature ?? mediciones.temperatura,
      hum: mediciones.humidity ?? mediciones.humedad,
      pres: mediciones.pressure ?? mediciones.presion,
      dust: mediciones.pm2_5 ?? mediciones.polvoPorMetroCubico,
      gas: mediciones.gas_concentration ?? mediciones.gases
    };
  }

  if (opciones.modo === 'man') {
    return { ...manual };
  }

  if (!simulacionBackendActiva) {
    const activar = await fetch(`${API}/api/v1/simulation`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true })
    });
    await verificarRespuesta(activar);
    simulacionBackendActiva = true;
  }
  const respuesta = await fetch(`${API}/api/v1/status`);
  await verificarRespuesta(respuesta);
  const registro = await respuesta.json();
  riesgosBackend = registro.sensor_risks ?? null;
  const d = registro.data ?? {};
  return { temp: d.temperature, hum: d.humidity, pres: d.pressure, dust: d.pm2_5, gas: d.gas_concentration };
}

async function actualizar() {
  let datos;
  try {
    datos = await leerDatos();
    errorCarga = null;
  } catch (error) {
    errorCarga = error instanceof TypeError
      ? `No se pudo conectar con la API ${API}. Verificá que el backend esté iniciado.`
      : error.message || 'No se pudieron cargar los datos.';
    riesgosBackend = null;
    dibujar();
    return;
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
  if (opciones.modo === 'sim' && e.target.value !== 'sim') {
    desactivarSimulacionBackend();
  }
  riesgosBackend = null;
  opciones.modo = e.target.value;
  guardarOpciones();
  aplicarModo();
  limpiarSeleccion();
  if (opciones.modo === 'man') programarGuardadoManual();
};

$('url').value = opciones.url;
$('url').oninput = e => {
  opciones.url = e.target.value;
  guardarOpciones();
};

for (const clave of Object.keys(manual)) {
  const input = $('m-' + clave);
  input.value = manual[clave];
  input.oninput = e => {
    manual[clave] = e.target.value === '' ? NaN : parseFloat(e.target.value);
    limpiarSeleccion();
    programarGuardadoManual();
  };
}

function desactivarSimulacionBackend() {
  fetch(`${API}/api/v1/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false })
  }).catch(() => {});
  simulacionBackendActiva = false;
}

let temporizadorGuardadoManual;
function programarGuardadoManual() {
  clearTimeout(temporizadorGuardadoManual);
  $('estadoManual').textContent = 'Guardando cambios manuales…';
  temporizadorGuardadoManual = setTimeout(guardarRegistroManual, 500);
}

async function guardarRegistroManual() {
  const estado = $('estadoManual');
  const valores = Object.values(manual);
  if (!valores.every(Number.isFinite)) {
    estado.textContent = 'Completá los cinco valores para guardar la lectura.';
    return;
  }

  const [temperature, humidity, pressure, pm2_5, gas_concentration] = valores;
  const dentroDeRango = temperature >= -40 && temperature <= 85 &&
    humidity >= 0 && humidity <= 100 && pressure >= 300 && pressure <= 1100 &&
    pm2_5 >= 0 && gas_concentration >= 0;
  if (!dentroDeRango) {
    estado.textContent = 'Hay valores fuera del rango aceptado por el backend.';
    return;
  }

  const registro = {
    record_type: 'reading',
    group: 2,
    timestamp: new Date().toISOString(),
    data: { temperature, humidity, pressure, pm2_5, gas_concentration },
    metadata: { environment: 'test', source_type: 'simulated' }
  };

  try {
    const respuesta = await fetch(`${API}/api/v1/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registro)
    });
    await verificarRespuesta(respuesta);
    const procesado = await respuesta.json();
    riesgosBackend = procesado.sensor_risks ?? null;
    estado.textContent = 'Lectura manual guardada en la base de datos.';
  } catch (error) {
    estado.textContent = error instanceof TypeError
      ? `No se pudo conectar con la API ${API}.`
      : `No se pudo guardar la lectura: ${error.message}`;
  }
}

function dibujarTablaUmbrales() {
  const filas = Object.values(SENSORES).map(c => {
    if (!c.normal) {
      const v = PRESION.ventanaMin;
      return `<tr>
        <th>${c.titulo}<br><span class="muted">${c.sensor}</span></th>
        <td class="ok">Cambio en ${v} min &lt; ${PRESION.precaucion} hPa y ritmo &lt; ${PRESION.horaMax} hPa/h</td>
        <td class="warn">Cambio en ${v} min ≥ ${PRESION.precaucion} hPa, o ritmo ≥ ${PRESION.horaMax} hPa/h sostenido (30 min o más)</td>
        <td class="bad">Cambio en ${v} min &gt; ${PRESION.peligro} hPa</td>
      </tr>`;
    }

    const f = x => formatear(x, c.dec);
    const [n0, n1] = c.normal;
    const precaucion = [];
    if (n0 > 0) precaucion.push(`&lt; ${f(n0)}`);
    precaucion.push(`&gt; ${f(n1)} y ≤ ${f(c.precaucionMax)}`);

    return `<tr>
      <th>${c.titulo}<br><span class="muted">${c.sensor}</span></th>
      <td class="ok">${f(n0)} – ${f(n1)} ${c.unidad}</td>
      <td class="warn">${precaucion.join(' o ')} ${c.unidad}</td>
      <td class="bad">&gt; ${f(c.precaucionMax)} ${c.unidad}</td>
    </tr>`;
  });

  $('tabla-umbrales').innerHTML = `
    <thead><tr><th>Sensor</th><th>Normal</th><th>Precaución</th><th>Peligroso</th></tr></thead>
    <tbody>${filas.join('')}</tbody>`;
}

dibujarTablaUmbrales = async function () {
  const nombres = { temp: 'temperature', hum: 'humidity', pres: 'pressure', dust: 'pm2_5', gas: 'gas_concentration' };
  const unidades = { temperature: '°C', humidity: '%', pressure: 'hPa', pm2_5: 'µg/m³', gas_concentration: 'ADC' };
  try {
    const response = await fetch(`${API}/api/v1/thresholds`);
    if (!response.ok) throw new Error();
    const thresholds = await response.json();
    umbralesBackend = thresholds;
    const filas = Object.entries(SENSORES).map(([key, sensor]) => {
      const t = thresholds[nombres[key]];
      const f = value => formatear(value, sensor.dec);
      const greater = t.higher_is_risk;
      const between = (a, b) => greater ? `≥ ${f(a)} y &lt; ${f(b)}` : `≤ ${f(a)} y &gt; ${f(b)}`;
      const normal = greater ? `&lt; ${f(t.low)}` : `&gt; ${f(t.low)}`;
      const high = greater ? `≥ ${f(t.high)}` : `≤ ${f(t.high)}`;
      const unit = unidades[nombres[key]];
      return `<tr><th>${sensor.titulo}<br><span class="muted">${sensor.sensor}</span></th><td class="ok">${normal} ${unit}</td><td class="warn">${between(t.low, t.mid)} ${unit}</td><td class="warn">${between(t.mid, t.high)} ${unit}</td><td class="bad">${high} ${unit}</td></tr>`;
    });
    $('tabla-umbrales').innerHTML = `<thead><tr><th>Sensor</th><th>Normal</th><th>Low</th><th>Mid</th><th>High</th></tr></thead><tbody>${filas.join('')}</tbody>`;
  } catch {
    $('tabla-umbrales').innerHTML = '<tbody><tr><td colspan="5">No se pudieron cargar los umbrales del backend.</td></tr></tbody>';
  }
};

dibujarTablaUmbrales();

const REQUISITOS_ALERTA = {
  desgasificacion: {
    nombre: 'Desgasificación',
    req: {
      gas: { min: SENSORES.gas.normal[1], minExcl: true, pref: 1200 },
      dust: { min: SENSORES.dust.normal[1], minExcl: true, pref: 150 }
    }
  },
  inversion: {
    nombre: 'Frío extremo',
    req: {
      temp: { max: ALERTAS.frioMax, pref: 1 },
      gas: { min: SENSORES.gas.normal[1], minExcl: true, pref: 1200 },
      dust: { min: SENSORES.dust.normal[1], minExcl: true, pref: 150 }
    }
  },
  pluma: {
    nombre: 'Pluma seca',
    req: {
      hum: { max: ALERTAS.humSecaMax, pref: 46 },
      pres: { pref: VALORES_BASE.pres, texto: 'presión estable' },
      dust: { min: SENSORES.dust.normal[1], minExcl: true, pref: 150 }
    }
  }
};

function textoRequisito(sensor, r) {
  if (r.texto) return r.texto;
  const { titulo, unidad } = SENSORES[sensor];
  const partes = [];
  if (r.min !== undefined) partes.push(`${r.minExcl ? '>' : '≥'} ${r.min}`);
  if (r.max !== undefined) partes.push(`${r.maxExcl ? '<' : '≤'} ${r.max}`);
  return `${titulo} ${partes.join(' y ')} ${unidad}`;
}

function combinarRequisitos(ids) {
  const rangos = {};
  for (const id of ids) {
    for (const [sensor, r] of Object.entries(REQUISITOS_ALERTA[id].req)) {
      const a = rangos[sensor] ??= { min: -Infinity, minExcl: false, max: Infinity, maxExcl: false, prefs: [] };
      if (r.min !== undefined && (r.min > a.min || (r.min === a.min && r.minExcl))) {
        a.min = r.min;
        a.minExcl = !!r.minExcl;
      }
      if (r.max !== undefined && (r.max < a.max || (r.max === a.max && r.maxExcl))) {
        a.max = r.max;
        a.maxExcl = !!r.maxExcl;
      }
      a.prefs.push(r.pref);
    }
  }
  return rangos;
}

const rangoVacio = a => a.min > a.max || (a.min === a.max && (a.minExcl || a.maxExcl));

function elegirValor(a) {
  const dentro = v => (v > a.min || (v === a.min && !a.minExcl)) && (v < a.max || (v === a.max && !a.maxExcl));
  const preferido = a.prefs.find(dentro);
  if (preferido !== undefined) return preferido;
  if (isFinite(a.min) && isFinite(a.max)) return (a.min + a.max) / 2;
  if (isFinite(a.min)) return a.min + (Math.abs(a.min) * 0.1 || 1);
  return a.max - (Math.abs(a.max) * 0.1 || 1);
}

function motivoIncompatibilidad(id, elegidas) {
  const nombre = k => REQUISITOS_ALERTA[k].nombre;
  for (const otra of elegidas) {
    const rangos = combinarRequisitos([id, otra]);
    const sensor = Object.keys(rangos).find(s => rangoVacio(rangos[s]));
    if (sensor) {
      const rA = REQUISITOS_ALERTA[id].req[sensor];
      const rB = REQUISITOS_ALERTA[otra].req[sensor];
      return `«${nombre(id)}» y «${nombre(otra)}» son fenómenos no compatibles entre sí: ` +
        `${nombre(id)} requiere ${textoRequisito(sensor, rA)}, mientras que ${nombre(otra)} requiere ${textoRequisito(sensor, rB)}. ` +
        `Son valores contradictorios y no pueden darse a la vez.`;
    }
  }
  const rangos = combinarRequisitos([id, ...elegidas]);
  const sensor = Object.keys(rangos).find(s => rangoVacio(rangos[s]));
  return sensor
    ? `«${nombre(id)}» no es compatible con la combinación de alertas elegida: los valores de ${SENSORES[sensor].titulo.toLowerCase()} que exige se contradicen.`
    : null;
}

const alertasElegidas = new Set();
const botonesAlerta = {};

function sincronizarCampos() {
  for (const clave of Object.keys(manual)) {
    $('m-' + clave).value = isNaN(manual[clave]) ? '' : manual[clave];
  }
}

function renderizarSimulador() {
  const avisos = [];
  for (const [id, boton] of Object.entries(botonesAlerta)) {
    const elegida = alertasElegidas.has(id);
    const motivo = elegida ? null : motivoIncompatibilidad(id, [...alertasElegidas]);
    boton.setAttribute('aria-pressed', elegida);
    boton.disabled = !!motivo;
    boton.title = motivo || '';
    if (motivo) avisos.push(motivo);
  }
  const aviso = $('aviso-alertas');
  aviso.replaceChildren(...avisos.map(texto => {
    const p = document.createElement('p');
    p.textContent = texto;
    return p;
  }));
  aviso.hidden = !avisos.length;
}

function limpiarSeleccion() {
  alertasElegidas.clear();
  renderizarSimulador();
}

function aplicarAlertasElegidas() {
  const valores = { ...VALORES_BASE };
  for (const [sensor, rango] of Object.entries(combinarRequisitos([...alertasElegidas]))) {
    valores[sensor] = elegirValor(rango);
  }
  Object.assign(manual, valores);
  if (opciones.modo === 'sim') desactivarSimulacionBackend();
  historial.pres.length = 0;
  opciones.modo = 'man';
  guardarOpciones();
  aplicarModo();
  sincronizarCampos();
  renderizarSimulador();
  programarGuardadoManual();
  iniciar();
}

function restablecer() {
  alertasElegidas.clear();
  Object.assign(manual, VALORES_BASE);
  Object.assign(simulado, VALORES_BASE);
  for (const clave in historial) historial[clave].length = 0;
  opciones.modo = 'sim';
  guardarOpciones();
  aplicarModo();
  sincronizarCampos();
  renderizarSimulador();
  iniciar();
}

for (const [id, { nombre }] of Object.entries(REQUISITOS_ALERTA)) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = nombre;
  boton.onclick = () => {
    if (alertasElegidas.has(id)) alertasElegidas.delete(id);
    else alertasElegidas.add(id);
    if (alertasElegidas.size) aplicarAlertasElegidas();
    else restablecer();
  };
  botonesAlerta[id] = boton;
  $('btn-reset').before(boton);
}
$('btn-reset').onclick = restablecer;
renderizarSimulador();

aplicarModo();
if (opciones.modo !== 'sim') {
  fetch(`${API}/api/v1/simulation`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false }) }).catch(() => {});
}
iniciar();
