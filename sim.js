// The loop agent as a nervous system: it learns to route signals, grows a new part each time it has
// learned, and ends as a human brain. Pure logic: no DOM. Loaded by index.html and by bench.cjs.
(function (root) {
  'use strict';

  function mulberry(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // The brain faces left: front is -x, up is +y, z is left/right.
  // seq: place in a signal's route (null = not on the route). stage: when the part grows in (ADR order).
  const REGIONS = [
    { id: 'thalamus', seq: 1, stage: 0, color: '#fff0c8' },
    { id: 'motor', seq: 4, stage: 0, color: '#ff8f66' },
    { id: 'brainstem', seq: 8, stage: 0, color: '#86f0b4' },
    { id: 'parietal', seq: 5, stage: 0, color: '#ffd98a' },
    { id: 'insula', seq: null, stage: 1, color: '#a8c7ff' },
    { id: 'cerebellum', seq: null, stage: 2, color: '#9be28a' },
    { id: 'somatosensory', seq: 6, stage: 3, color: '#ffb37a' },
    { id: 'cingulate', seq: 7, stage: 4, color: '#ff7fb8' },
    { id: 'hippocampus', seq: 3, stage: 5, color: '#6fe3e0' },
    { id: 'reflex', seq: null, stage: 6, color: '#ff5d73' },
    { id: 'hypothalamus', seq: null, stage: 7, color: '#ffa3a3' },
    { id: 'broca', seq: null, stage: 8, color: '#d59bff' },
    { id: 'wernicke', seq: 0, stage: 9, color: '#7fd4ff' },
    { id: 'prefrontal', seq: 2, stage: 10, color: '#b79bff' },
    { id: 'amygdala', seq: null, stage: 11, color: '#ff6f9d' },
    { id: 'basal', seq: null, stage: 12, color: '#f3a0ff' },
    { id: 'occipital', seq: null, stage: 13, color: '#8fb6ff' },
    { id: 'olfactory', seq: null, stage: 13, color: '#c9f08a' },
  ];
  const LAST_STAGE = 13;
  const INDEX = Object.fromEntries(REGIONS.map((r, i) => [r.id, i]));

  function gauss(rand) {
    return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  }
  function onEllipsoid(rand, c, r, shell) {
    let d;
    do {
      d = [gauss(rand), gauss(rand), gauss(rand)];
    } while (Math.hypot(d[0], d[1], d[2]) < 1e-6);
    const n = Math.hypot(d[0], d[1], d[2]);
    const k = shell + (1 - shell) * rand();
    return [c[0] + (d[0] / n) * r[0] * k, c[1] + (d[1] / n) * r[1] * k, c[2] + (d[2] / n) * r[2] * k];
  }

  function cortexRegion(x, y) {
    if (x >= 0.84) return 'occipital';
    if (x < -0.6) return 'prefrontal';
    if (x < -0.1 && y < 0.1) return 'broca';
    if (x < 0.0) return 'motor';
    if (x < 0.3) return 'somatosensory';
    return y < -0.08 ? 'occipital' : 'parietal';
  }

  function routeAt(stage) {
    return REGIONS.map((region, r) => ({ r, seq: region.seq, stage: region.stage }))
      .filter((x) => x.seq !== null && x.stage <= stage)
      .sort((p, q) => p.seq - q.seq)
      .map((x) => x.r);
  }

  function createGraph(seed) {
    const rand = mulberry(seed);
    const nodes = [];
    const add = (id, p) => nodes.push({ x: p[0], y: p[1], z: p[2], region: INDEX[id], stage: REGIONS[INDEX[id]].stage });
    for (const h of [1, -1]) {
      // Cerebral cortex: a shell with a flat base and a gap between the hemispheres.
      let made = 0;
      while (made < 300) {
        const p = onEllipsoid(rand, [0, 0.12, h * 0.3], [1.3, 0.76, 0.44], 0.9);
        const base = -0.3 + 0.1 * Math.max(0, -p[0]); // the frontal lobe sits a little higher at its base
        if (p[1] < base || p[2] * h < 0.035) continue;
        add(cortexRegion(p[0], p[1]), p);
        made++;
      }
      for (let i = 0; i < 62; i++) add('wernicke', onEllipsoid(rand, [-0.1, -0.43, h * 0.47], [0.74, 0.22, 0.25], 0.8));
      for (let i = 0; i < 60; i++) {
        let p;
        do p = onEllipsoid(rand, [0.84, -0.62, h * 0.2], [0.43, 0.27, 0.33], 0.82);
        while (p[2] * h < 0.02);
        add('cerebellum', p);
      }
      for (let i = 0; i < 15; i++) add('hippocampus', [0.18 + gauss(rand) * 0.16, -0.2 + gauss(rand) * 0.04, h * (0.27 + gauss(rand) * 0.04)]);
      for (let i = 0; i < 11; i++) add('amygdala', [-0.2 + gauss(rand) * 0.05, -0.23 + gauss(rand) * 0.05, h * (0.27 + gauss(rand) * 0.04)]);
      for (let i = 0; i < 15; i++) add('basal', [-0.24 + gauss(rand) * 0.1, 0.15 + gauss(rand) * 0.07, h * (0.2 + gauss(rand) * 0.04)]);
      for (let i = 0; i < 15; i++) add('insula', [-0.08 + gauss(rand) * 0.12, 0.0 + gauss(rand) * 0.08, h * (0.34 + gauss(rand) * 0.02)]);
      for (let i = 0; i < 9; i++) add('olfactory', [-0.98 + gauss(rand) * 0.09, -0.3 + gauss(rand) * 0.025, h * (0.1 + gauss(rand) * 0.03)]);
      for (let i = 0; i < 20; i++) {
        // The cingulate arcs over the middle of the brain, just off the midline.
        const a = (25 + rand() * 140) * (Math.PI / 180);
        add('cingulate', [-Math.cos(a) * 0.74 + gauss(rand) * 0.03, -0.04 + Math.sin(a) * 0.44 + gauss(rand) * 0.03, h * (0.07 + rand() * 0.04)]);
      }
    }
    for (let i = 0; i < 26; i++) add('thalamus', [0.08 + gauss(rand) * 0.1, 0.02 + gauss(rand) * 0.07, gauss(rand) * 0.1]);
    for (let i = 0; i < 12; i++) add('hypothalamus', [-0.08 + gauss(rand) * 0.05, -0.2 + gauss(rand) * 0.04, gauss(rand) * 0.05]);
    for (let i = 0; i < 46; i++) {
      const t = rand();
      add('brainstem', [0.2 + t * 0.22 + gauss(rand) * 0.05, -0.38 - t * 0.56 + gauss(rand) * 0.03, gauss(rand) * 0.06]);
    }
    for (let i = 0; i < 20; i++) {
      const t = rand();
      add('reflex', [0.43 + t * 0.05 + gauss(rand) * 0.02, -0.96 - t * 0.24, gauss(rand) * 0.03]);
    }

    REGIONS.forEach((region, r) => {
      const own = nodes.filter((n) => n.region === r);
      region.center = ['x', 'y', 'z'].map((k) => own.reduce((s, n) => s + n[k], 0) / own.length);
      // Bilateral parts are labelled on the near side.
      const near = own.filter((n) => n.z > 0.05);
      region.label = near.length > 3 ? ['x', 'y', 'z'].map((k) => near.reduce((s, n) => s + n[k], 0) / near.length) : region.center;
    });

    const edges = [];
    const seen = new Set();
    const link = (a, b, tract) => {
      const key = a < b ? a + ':' + b : b + ':' + a;
      if (a === b || seen.has(key)) return;
      seen.add(key);
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y, nodes[a].z - nodes[b].z);
      edges.push({ a, b, len: d, tract: !!tract, stage: Math.max(nodes[a].stage, nodes[b].stage) });
    };
    // Local wiring: each neuron reaches for its nearest neighbours that exist by the time it grows.
    const K = 4;
    for (let a = 0; a < nodes.length; a++) {
      const near = [];
      for (let b = 0; b < nodes.length; b++) {
        if (a === b || nodes[b].stage > nodes[a].stage) continue;
        near.push([Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y, nodes[a].z - nodes[b].z), b]);
      }
      near.sort((p, q) => p[0] - q[0]);
      for (const [, b] of near.slice(0, K)) link(a, b);
    }
    // White-matter tracts: a few long fibres between parts that are neighbours on the route at any stage.
    const members = REGIONS.map((_, r) => nodes.map((n, i) => (n.region === r ? i : -1)).filter((i) => i >= 0));
    const any = (r) => members[r][Math.floor(rand() * members[r].length)];
    const pairs = new Set();
    for (let stage = 0; stage <= LAST_STAGE; stage++) {
      const route = routeAt(stage);
      for (let i = 0; i + 1 < route.length; i++) pairs.add(route[i] + ':' + route[i + 1]);
    }
    for (const pair of pairs) {
      const [ra, rb] = pair.split(':').map(Number);
      for (let i = 0; i < 6; i++) link(any(ra), any(rb), true);
    }
    // Parts off the route still join the whole: three fibres each to the thalamus.
    REGIONS.forEach((region, r) => {
      if (region.seq !== null) return;
      for (let i = 0; i < 3; i++) link(any(r), any(INDEX.thalamus), true);
    });

    const adj = nodes.map(() => []);
    edges.forEach((e, i) => {
      adj[e.a].push({ to: e.b, edge: i, dir: 0 });
      adj[e.b].push({ to: e.a, edge: i, dir: 1 });
    });
    return { nodes, edges, adj, regions: REGIONS, members };
  }

  // Surface points that are only drawn: the folded cortex, the temporal lobe, the cerebellum and the stem.
  function createCloud(seed) {
    const rand = mulberry(seed);
    const pts = [];
    const fold = (x, y, z) => Math.sin(9 * x + 2.5 * Math.sin(7 * y + 5 * z)) + Math.sin(8 * y + 2.5 * Math.sin(6 * x - 4 * z));
    const sylvian = (x) => -0.2 + 0.1 * x;
    for (const h of [1, -1]) {
      let made = 0;
      while (made < 2700) {
        const p = onEllipsoid(rand, [0, 0.12, h * 0.3], [1.3, 0.76, 0.44], 0.955);
        const base = -0.3 + 0.1 * Math.max(0, -p[0]);
        if (p[1] < base || p[2] * h < 0.03) continue;
        if (Math.abs(fold(p[0], p[1], p[2])) < 0.42) continue; // sulci
        const lateral = Math.abs(p[2]) > 0.3;
        if (lateral && p[0] > -0.8 && p[0] < 0.5 && p[1] < sylvian(p[0]) + 0.05) continue; // Sylvian fissure
        if (p[1] > 0 && Math.abs(p[0] - 0.24 * (p[1] - 0.3)) < 0.028) continue; // central sulcus
        pts.push([p[0], p[1], p[2], INDEX[cortexRegion(p[0], p[1])]]);
        made++;
      }
      made = 0;
      while (made < 620) {
        const p = onEllipsoid(rand, [-0.1, -0.43, h * 0.47], [0.74, 0.22, 0.25], 0.94);
        if (p[1] > sylvian(p[0]) - 0.03) continue;
        if (Math.abs(fold(p[0] * 1.3, p[1] * 1.6, p[2])) < 0.3) continue;
        pts.push([p[0], p[1], p[2], INDEX.wernicke]);
        made++;
      }
      made = 0;
      while (made < 700) {
        const p = onEllipsoid(rand, [0.84, -0.62, h * 0.2], [0.43, 0.27, 0.33], 0.95);
        if (p[2] * h < 0.02 || Math.sin(p[1] * 62) > 0.25) continue; // folia: fine horizontal leaves
        pts.push([p[0], p[1], p[2], INDEX.cerebellum]);
        made++;
      }
    }
    for (let i = 0; i < 420; i++) {
      const t = rand(), a = rand() * Math.PI * 2, r = 0.11 - t * 0.03;
      pts.push([0.2 + t * 0.22 + Math.cos(a) * r, -0.36 - t * 0.6, Math.sin(a) * r, INDEX.brainstem]);
    }
    for (let i = 0; i < 130; i++) {
      const t = rand(), a = rand() * Math.PI * 2;
      pts.push([0.43 + t * 0.05 + Math.cos(a) * 0.05, -0.96 - t * 0.26, Math.sin(a) * 0.05, INDEX.reflex]);
    }
    pts.sort((p, q) => p[3] - q[3]);
    return pts;
  }

  const P = {
    hopTime: 0.075, // seconds per synapse
    maxHops: 34, // energy for one leg of the route
    beta: 2.2, // how strongly a signal follows learned strength
    guide: 0.05, // weak chemical gradient toward the target, per unit distance
    deposit: 9,
    cap: 14,
    evaporate: 0.9985,
    window: 40,
    minSent: 70,
    learned: 0.72, // share of signals that must arrive before the next part grows
  };

  function createSim(graph, seed, options) {
    const opts = options || {};
    const rand = mulberry(seed);
    const R = graph.regions.length;
    const E = graph.edges.length;
    const sim = {
      graph,
      stage: opts.stage || 0,
      locked: !!opts.locked,
      w: opts.weights ? Float32Array.from(opts.weights) : new Float32Array(E * 2 * R),
      act: new Float32Array(graph.nodes.length),
      impulses: [],
      outcomes: [],
      sent: 0,
      arrived: 0,
      stageSent: 0,
      hopsOk: [],
      snapshots: {},
      events: [],
    };
    sim.snapshots[sim.stage] = Float32Array.from(sim.w);
    sim.route = () => routeAt(sim.stage);
    let route = sim.route();

    sim.fire = function (count) {
      const sources = graph.members[route[0]];
      for (let i = 0; i < (count || 1); i++) {
        const node = sources[Math.floor(rand() * sources.length)];
        sim.impulses.push({ node, next: -1, edge: -1, t: 1, leg: 1, hops: 0, total: 0, path: [node], dead: false });
        sim.act[node] = 1;
        sim.sent++;
        sim.stageSent++;
      }
    };

    function choose(imp) {
      const target = route[imp.leg];
      const c = graph.regions[target].center;
      const here = graph.nodes[imp.node];
      const dHere = Math.hypot(here.x - c[0], here.y - c[1], here.z - c[2]);
      const prev = imp.path.length > 1 ? imp.path[imp.path.length - 2] : -1;
      const options = [];
      let sum = 0;
      for (const link of graph.adj[imp.node]) {
        if (graph.edges[link.edge].stage > sim.stage) continue;
        if (link.to === prev) continue;
        const n = graph.nodes[link.to];
        const gain = dHere - Math.hypot(n.x - c[0], n.y - c[1], n.z - c[2]);
        const weight = sim.w[(link.edge * 2 + link.dir) * R + target];
        const score = Math.pow(1 + weight, P.beta) * Math.exp(P.guide * gain);
        options.push([link, score]);
        sum += score;
      }
      if (options.length === 0) return graph.adj[imp.node].find((l) => graph.edges[l.edge].stage <= sim.stage);
      let pick = rand() * sum;
      for (const [link, score] of options) {
        pick -= score;
        if (pick <= 0) return link;
      }
      return options[options.length - 1][0];
    }

    function reinforce(path, target) {
      const amount = P.deposit / Math.max(1, path.length - 1);
      for (let i = 0; i + 1 < path.length; i++) {
        const link = graph.adj[path[i]].find((l) => l.to === path[i + 1]);
        const k = (link.edge * 2 + link.dir) * R + target;
        sim.w[k] = Math.min(P.cap, sim.w[k] + amount);
      }
    }

    function finish(imp, ok) {
      imp.dead = true;
      sim.outcomes.push(ok ? 1 : 0);
      if (sim.outcomes.length > P.window) sim.outcomes.shift();
      if (ok) {
        sim.arrived++;
        sim.hopsOk.push(imp.total);
        if (sim.hopsOk.length > P.window) sim.hopsOk.shift();
      }
      for (let k = 0; k < sim.w.length; k++) sim.w[k] *= P.evaporate;
      sim.events.push({ type: ok ? 'arrived' : 'lost', node: imp.node });
      if (!sim.locked && sim.stage < LAST_STAGE && sim.outcomes.length >= P.window && sim.stageSent >= P.minSent && sim.rate() >= P.learned) grow();
    }

    function grow() {
      sim.stage++;
      sim.snapshots[sim.stage] = Float32Array.from(sim.w);
      const before = route.join();
      route = sim.route();
      sim.stageSent = 0;
      if (route.join() !== before) {
        // The route changed: what is in flight no longer counts, and the readout starts again.
        for (const other of sim.impulses) other.dead = true;
        sim.impulses = [];
        sim.outcomes = [];
        sim.hopsOk = [];
      }
      sim.events.push({ type: 'grew', stage: sim.stage });
    }

    sim.rate = function () {
      if (sim.outcomes.length === 0) return 0;
      return sim.outcomes.reduce((a, b) => a + b, 0) / sim.outcomes.length;
    };
    sim.meanHops = function () {
      if (sim.hopsOk.length === 0) return 0;
      return sim.hopsOk.reduce((a, b) => a + b, 0) / sim.hopsOk.length;
    };

    sim.step = function (dt) {
      const fade = Math.exp(-dt * 5);
      for (let i = 0; i < sim.act.length; i++) sim.act[i] *= fade;
      for (const imp of sim.impulses) {
        if (imp.dead) continue;
        imp.t += dt / P.hopTime;
        while (imp.t >= 1 && !imp.dead) {
          if (imp.next >= 0) {
            imp.node = imp.next;
            imp.hops++;
            imp.total++;
            sim.act[imp.node] = 1;
            const loop = imp.path.indexOf(imp.node);
            if (loop >= 0) imp.path.length = loop + 1;
            else imp.path.push(imp.node);
            const target = route[imp.leg];
            if (graph.nodes[imp.node].region === target) {
              reinforce(imp.path, target);
              imp.leg++;
              imp.hops = 0;
              imp.path = [imp.node];
              if (imp.leg >= route.length) {
                finish(imp, true);
                break;
              }
            } else if (imp.hops >= P.maxHops) {
              finish(imp, false);
              break;
            }
          }
          const link = choose(imp);
          imp.next = link.to;
          imp.edge = link.edge;
          imp.t -= 1;
        }
      }
      if (sim.impulses.some((i) => i.dead)) sim.impulses = sim.impulses.filter((i) => !i.dead);
      const out = sim.events;
      sim.events = [];
      return out;
    };

    return sim;
  }

  const api = { createGraph, createSim, createCloud, REGIONS, LAST_STAGE, P, INDEX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NeuralSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
