const EFECTOS = (() => {
  const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
  const rnd = (min, max) => min + Math.random() * (max - min);
  const pct = () => `${rnd(2, 98).toFixed(1)}%`;
  const seg = t => `${t.toFixed(1)}s`;
  const px = n => `${n.toFixed(0)}px`;

  const TEMP_CALOR_SUAVE = 28;
  const PRESION_REF = 1013;

  function crear(capa, clase, n, props, texto = '') {
    return Array.from({ length: n }, (_, i) => {
      const el = document.createElement('i');
      el.className = clase;
      if (texto) el.textContent = texto;
      for (const [k, v] of Object.entries(props(i, n))) el.style.setProperty('--' + k, v);
      capa.append(el);
      return el;
    });
  }

  function mostrar(lista, frac) {
    const n = Math.ceil(clamp(frac) * lista.length - 1e-9);
    lista.forEach((el, i) => el.classList.toggle('on', i < n));
  }

  function div(capa, clase) {
    const el = document.createElement('div');
    el.className = clase;
    capa.append(el);
    return el;
  }

  const constructores = {
    temp(back) {
      const c = SENSORES.temp;
      const copos = crear(back, 'copo', 16, () => {
        const t = rnd(5, 10);
        return { x: pct(), s: px(rnd(8, 15)), t: seg(t), d: seg(-rnd(0, t)), dx: px(rnd(-25, 25)) };
      }, '❄\uFE0E');
      const sol = div(back, 'sol');

      return v => {
        const hay = !isNaN(v);
        mostrar(copos, hay ? (c.normal[0] - v) / c.normal[0] : 0);

        let tinte = 'transparent';
        let astro = null;
        let pulso = false;
        if (hay) {
          if (v <= ALERTAS.frioMax) tinte = 'rgba(59,130,246,.26)';
          else if (v < c.normal[0]) tinte = 'rgba(96,165,250,.15)';
          else if (v > c.precaucionMax) {
            tinte = 'rgba(239,68,68,.28)';
            astro = { color: '239,68,68', o: 0.75, s: 1.3, giro: '12s' };
            pulso = true;
          } else if (v > c.normal[1]) {
            tinte = 'rgba(249,115,22,.18)';
            astro = { color: '249,115,22', o: 0.55, s: 1.05, giro: '22s' };
          } else if (v > TEMP_CALOR_SUAVE) {
            tinte = 'rgba(250,204,21,.10)';
            astro = { color: '250,204,21', o: 0.4, s: 0.85, giro: '40s' };
          }
        }

        back.style.setProperty('--tint', tinte);
        back.classList.toggle('pulso', pulso);
        sol.style.setProperty('--so', astro ? astro.o : 0);
        if (astro) {
          sol.style.setProperty('--sc', astro.color);
          sol.style.setProperty('--ss', astro.s);
          sol.style.setProperty('--giro', astro.giro);
        }
      };
    },

    hum(back) {
      const c = SENSORES.hum;
      const gotas = crear(back, 'gota', 14, () => {
        const t = rnd(0.8, 1.6);
        return { x: pct(), s: px(rnd(8, 14)), t: seg(t), d: seg(-rnd(0, t)), dx: '-6px' };
      });
      const niebla = div(back, 'niebla');

      return v => {
        const hay = !isNaN(v);
        mostrar(gotas, hay ? (v - 55) / 40 : 0);
        niebla.style.setProperty('--o', hay ? clamp((v - c.normal[1]) / 20) * 0.55 : 0);

        let tinte = 'transparent';
        if (hay) {
          if (v < c.normal[0]) tinte = 'rgba(217,119,6,.10)';
          else if (v > c.precaucionMax) tinte = 'rgba(37,99,235,.20)';
          else if (v > c.normal[1]) tinte = 'rgba(56,189,248,.12)';
        }
        back.style.setProperty('--tint', tinte);
      };
    },

    pres(back) {
      const ondas = crear(back, 'onda', 3, i => ({ k: (i / 3).toFixed(2) }));
      const nubes = crear(back, 'nube', 3, () => {
        const t = rnd(35, 65);
        return { y: `${rnd(4, 40).toFixed(0)}%`, t: seg(t), d: seg(-rnd(0, t)) };
      });
      const estilos = {
        ok:   { vel: '6s',   o: 0.18, c: 'var(--accent)' },
        warn: { vel: '3.2s', o: 0.4,  c: 'var(--warnf)' },
        bad:  { vel: '1.6s', o: 0.55, c: 'var(--badf)' }
      };

      return (v, clase) => {
        const e = estilos[clase];
        back.style.setProperty('--o', e ? e.o : 0);
        if (e) {
          back.style.setProperty('--vel', e.vel);
          back.style.setProperty('--c', e.c);
        }
        mostrar(nubes, isNaN(v) ? 0 : (PRESION_REF - v) / 25);
      };
    },

    dust(back, front) {
      const c = SENSORES.dust;
      const bruma = div(front, 'bruma');
      const motas = crear(front, 'mota', 22, () => {
        const t = rnd(6, 14);
        return {
          x: pct(), y: pct(), s: px(rnd(2, 4)), t: seg(t), d: seg(-rnd(0, t)),
          dx: px(rnd(-50, 50)), dy: px(rnd(-20, 20))
        };
      });

      return v => {
        const n = isNaN(v) ? 0 : clamp(v / c.precaucionMax);
        mostrar(motas, n);
        bruma.style.setProperty('--n', n.toFixed(2));
      };
    },

    gas(back) {
      const c = SENSORES.gas;
      const humos = crear(back, 'humo', 10, () => {
        const t = rnd(7, 12);
        return { x: pct(), s: px(rnd(28, 56)), t: seg(t), d: seg(-rnd(0, t)), dx: px(rnd(-30, 30)) };
      });

      return (v, clase) => {
        const hay = !isNaN(v);
        const [n0, n1] = [c.normal[1], c.precaucionMax];
        const n = !hay ? 0 : v <= n0 ? clamp(v / n0) * 0.2 : 0.2 + 0.8 * clamp((v - n0) / (n1 - n0));
        mostrar(humos, n);

        back.style.setProperty('--gc', clase === 'bad' ? 'rgba(101,163,13,.55)' : 'rgba(163,190,60,.4)');
        back.style.setProperty('--tint',
          clase === 'bad' ? 'rgba(132,204,22,.20)' : clase === 'warn' ? 'rgba(132,204,22,.10)' : 'transparent');
      };
    }
  };

  const actualizadores = {};

  return {
    iniciar(clave, back, front) {
      actualizadores[clave] = constructores[clave]?.(back, front);
    },
    actualizar(clave, valor, clase) {
      actualizadores[clave]?.(valor, clase);
    }
  };
})();
