/**
 * Rutek — Seed de datos de prueba (v2)
 *
 * Crea la totalidad del sistema: clientes, usuarios (todos los roles),
 * vehículos con alertas de compliance, rutas (completadas, en progreso,
 * sin iniciar, cancelada), pedidos en todos los estados posibles,
 * asignaciones chofer/peoneta/vehículo y fotos PNG reales subidas a
 * Minio (o almacenamiento local según configuración del backend).
 *
 * Uso:
 *   node scripts/seed.mjs
 *
 * Variables de entorno:
 *   API_URL      — Default: http://localhost:4000
 *   ADMIN_EMAIL  — Super-admin del backend. Default: admin@rutek.local
 *   ADMIN_PASS   — Default: admin1234
 */

import { deflateSync } from 'zlib';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL    = process.env.API_URL    ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@rutek.local';
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'admin1234';

// Admin temporal que se crea para las operaciones de tenant
const SEED_ADMIN_EMAIL = 'seedadmin@rutek.cl';
const SEED_ADMIN_PASS  = 'SeedAdmin2024!';

// ─── Colores de log ───────────────────────────────────────────────────────────

const c = { reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m', gray:'\x1b[90m' };
const ok   = (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const skip = (msg) => console.log(`  ${c.yellow}–${c.reset} ${c.gray}${msg}${c.reset}`);
const fail = (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`);
const h1   = (msg) => console.log(`\n${c.bold}${c.cyan}▸ ${msg}${c.reset}`);
const note = (msg) => console.log(`  ${c.gray}${msg}${c.reset}`);

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

let TOKEN = null;

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${API_URL}${path}`, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, body: text });
  return text ? JSON.parse(text) : null;
}

async function uploadFile(path, fieldName, buffer, mimeType, fileName, extraFields = {}) {
  const fd = new FormData();
  fd.append(fieldName, new Blob([buffer], { type: mimeType }), fileName);
  for (const [k, v] of Object.entries(extraFields)) fd.append(k, v);
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: fd,
  });
  const text = await res.text();
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, body: text });
  return text ? JSON.parse(text) : null;
}

const post  = (path, body) => req('POST',  path, body);
const patch = (path, body) => req('PATCH', path, body);
const get   = (path)       => req('GET',   path);

async function tryPost(label, path, body) {
  try { const r = await post(path, body); ok(label); return r; }
  catch (e) {
    if (e.status === 409) { skip(`${label} — ya existe`); return null; }
    fail(`${label} — ${e.message}: ${String(e.body).slice(0, 160)}`);
    return null;
  }
}

async function tryPatch(label, path, body) {
  try { const r = await patch(path, body); ok(label); return r; }
  catch (e) { fail(`${label} — ${e.message}: ${String(e.body).slice(0, 160)}`); return null; }
}

async function tryUpload(label, path, fieldName, buffer, mimeType, fileName, extra = {}) {
  try { const r = await uploadFile(path, fieldName, buffer, mimeType, fileName, extra); ok(label); return r; }
  catch (e) { fail(`${label} — ${e.message}: ${String(e.body).slice(0, 160)}`); return null; }
}

// ─── Fecha helpers ────────────────────────────────────────────────────────────

const isoDate = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const isoNow  = ()  => new Date().toISOString();
const isoDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };

// ─── Generación de PNG puro (sin dependencias) ────────────────────────────────
// Crea una imagen 120×120 RGB con color sólido + marca de texto simulada.

function crc32(data) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (const b of data) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const combined = Buffer.concat([t, d]);
  const crcVal = crc32(combined);
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(d.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crcVal);
  return Buffer.concat([lenBuf, t, d, crcBuf]);
}

/**
 * Genera un PNG 120x120 de un color base con una franja más oscura en la
 * mitad superior (simula una foto de entrega con recibo).
 */
function makePNG(r, g, b) {
  const W = 120, H = 120;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = pngChunk('IHDR', Buffer.from([
    0,0,0,W, 0,0,0,H,
    8, 2, 0, 0, 0,
  ]));

  // Pixel data: fila superior 30% más oscura, franja blanca, resto color base
  const rowSize = 1 + W * 3;
  const raw = Buffer.alloc(H * rowSize);
  for (let y = 0; y < H; y++) {
    raw[y * rowSize] = 0; // filtro None
    for (let x = 0; x < W; x++) {
      let pr, pg, pb;
      if (y < 36) {
        // franja superior oscura (simula encabezado de recibo)
        pr = Math.max(0, r - 60);
        pg = Math.max(0, g - 60);
        pb = Math.max(0, b - 60);
      } else if (y >= 36 && y < 40) {
        // línea blanca separadora
        pr = 255; pg = 255; pb = 255;
      } else if (x >= 10 && x < 30 && y >= 50 && y < 60) {
        // "pixel" de firma simulada
        pr = 20; pg = 20; pb = 80;
      } else {
        pr = r; pg = g; pb = b;
      }
      raw[y * rowSize + 1 + x * 3 + 0] = pr;
      raw[y * rowSize + 1 + x * 3 + 1] = pg;
      raw[y * rowSize + 1 + x * 3 + 2] = pb;
    }
  }

  const idat = pngChunk('IDAT', deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Paleta por tipo de foto
const PHOTO_COLORS = {
  entrega:   [74, 222, 128],   // verde
  recepcion: [96, 165, 250],   // azul
  dano:      [248, 113, 113],  // rojo
  firma:     [167, 139, 250],  // violeta
  otro:      [156, 163, 175],  // gris
};

// ─── Datos ────────────────────────────────────────────────────────────────────

const CLIENTS_DATA = [
  { company_name:'Ripley S.A.',         contact_name:'Valentina Torres',  email:'vtorres@ripley.cl',   phone:'+56912345678', rut:'76.354.771-K', address:'Av. Kennedy 5413',      city:'Vitacura',  region:'Región Metropolitana', active:true,  notes:'Cliente VIP — despachos prioritarios' },
  { company_name:'Falabella Retail SpA', contact_name:'Rodrigo Mena',     email:'rmena@falabella.cl',  phone:'+56922334455', rut:'81.201.498-7', address:'Av. Kennedy 7100',       city:'Las Condes',region:'Región Metropolitana', active:true,  notes:'' },
  { company_name:'SODIMAC S.A.',         contact_name:'Carolina Díaz',    email:'cdiaz@sodimac.cl',    phone:'+56933445566', rut:'81.201.415-4', address:'Av. El Salto 4001',      city:'Huechuraba',region:'Región Metropolitana', active:true,  notes:'Confirmar entrega con foto' },
];

const USERS_DATA = [
  { name:'Carlos Rojas',     email:'crojas@rutek.cl',    password:'Demo1234', role:'operator', phone:'+56911111111' },
  { name:'Pedro González',   email:'pgonzalez@rutek.cl', password:'Demo1234', role:'driver',   phone:'+56922222222' },
  { name:'Luis Sepúlveda',  email:'lsepulveda@rutek.cl', password:'Demo1234', role:'driver',   phone:'+56933333333' },
  { name:'Sebastián Lara',  email:'slara@rutek.cl',      password:'Demo1234', role:'peoneta',  phone:'+56944444444' },
  { name:'María Fuentes',   email:'mfuentes@rutek.cl',   password:'Demo1234', role:'peoneta',  phone:'+56955555555' },
  { name:'Ripley Compras',   email:'compras@ripley.cl',  password:'Demo1234', role:'client',   phone:null },
];

const VEHICLES_DATA = [
  { plate:'BCJK31', brand:'Ford',         model:'Transit',  year:2021, type:'van',        capacity:1200, available:true,  vin:'1FTBW2XM3LKB00001',
    maintenanceDueDate: isoDate(15), circulationPermitDueDate: isoDate(90),  technicalReviewDueDate: isoDate(120) },
  { plate:'LMPT99', brand:'Mercedes-Benz',model:'Sprinter', year:2019, type:'cargo_truck',capacity:3500, available:true,  vin:'WDB9066331L123456',
    maintenanceDueDate: isoDate(60), circulationPermitDueDate: isoDate(-5), technicalReviewDueDate: isoDate(8)   },
  { plate:'FJRM22', brand:'Volkswagen',   model:'Crafter',  year:2022, type:'van',        capacity:2000, available:true,  vin:null,
    maintenanceDueDate: isoDate(180),circulationPermitDueDate: isoDate(200), technicalReviewDueDate: isoDate(150) },
  { plate:'XKRP44', brand:'Honda',        model:'PCX 150',  year:2023, type:'motorcycle', capacity:50,   available:false, vin:null,
    maintenanceDueDate: null,        circulationPermitDueDate: isoDate(300), technicalReviewDueDate: null },
];

// ─── Login helpers ────────────────────────────────────────────────────────────

async function login(email, password) {
  const res = await post('/auth/login', { email, password });
  const token = res.access_token ?? res.accessToken ?? res.token;
  if (!token) throw new Error('Token no encontrado en respuesta');
  return token;
}

// ─── Helper: crear orden con route_id ─────────────────────────────────────────

function orderBody({ clientId, clientName, status, priority, street, city, bultos, notes, routeId, driverId, driverName, peonetaId, peonetaName, vehicleId, vehiclePlate, estimatedOffset = 0 }) {
  const code = `ENT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  return {
    code, status, priority,
    client_id: clientId ?? '',
    client_name: clientName,
    origin_street: 'Bodega Central — Ruta 78 Km 8',
    origin_city: 'Pudahuel',
    origin_region: 'Región Metropolitana',
    destination_street: street,
    destination_city: city,
    destination_region: 'Región Metropolitana',
    items: [],
    total_weight: bultos * 12,
    total_volume: bultos * 0.08,
    estimated_delivery: new Date(Date.now() + estimatedOffset * 86_400_000).toISOString(),
    route_id: routeId,
    bultos,
    ...(notes ? { notes } : {}),
    ...(driverId ? { driver_id: driverId, driver_name: driverName } : {}),
    ...(peonetaId ? { peoneta_id: peonetaId, peoneta_name: peonetaName } : {}),
    ...(vehicleId ? { vehicle_id: vehicleId, vehicle_plate: vehiclePlate } : {}),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${c.bold}${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Rutek — Seed v2`);
  console.log(`  API: ${API_URL}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);

  // ── FASE 1: super_admin — crear admin de tenant ──
  h1('Fase 1: Autenticación como super_admin');
  try {
    TOKEN = await login(ADMIN_EMAIL, ADMIN_PASS);
    ok(`Sesión super_admin: ${ADMIN_EMAIL}`);
  } catch (e) {
    fail(`Login fallido — ${e.message}`);
    console.log(`\n  Ajusta las credenciales:\n  ADMIN_EMAIL=tu@mail.cl ADMIN_PASS=tu-pass npm run seed\n`);
    process.exit(1);
  }

  h1('Fase 2: Crear usuarios (todos los roles)');
  // Admin del tenant (necesario para clientes, vehículos, pedidos)
  const seedAdmin = await tryPost(
    `Seed Admin (admin)`,
    '/users',
    { name:'Seed Admin', email:SEED_ADMIN_EMAIL, password:SEED_ADMIN_PASS, role:'admin', active:true },
  );

  // Resto de usuarios
  const createdUsers = [];
  for (const u of USERS_DATA) {
    const body = { name:u.name, email:u.email, password:u.password, role:u.role, active:true };
    if (u.phone) body.phone = u.phone;
    const r = await tryPost(`${u.name} (${u.role})`, '/users', body);
    if (r) createdUsers.push(r);
  }

  // ── FASE 3: login como admin de tenant ──
  h1('Fase 3: Autenticación como admin de tenant');
  try {
    TOKEN = await login(SEED_ADMIN_EMAIL, SEED_ADMIN_PASS);
    ok(`Sesión admin: ${SEED_ADMIN_EMAIL}`);
  } catch (e) {
    fail(`Login admin fallido — ${e.message}`);
    fail('No se puede continuar sin admin del tenant. Verifica que el usuario seed se creó correctamente.');
    process.exit(1);
  }

  // ── FASE 4: clientes ──
  h1('Fase 4: Clientes (mandantes)');
  const createdClients = [];
  for (const client of CLIENTS_DATA) {
    const r = await tryPost(client.company_name, '/clients', client);
    if (r) createdClients.push(r);
  }

  // ── FASE 5: vehículos ──
  h1('Fase 5: Vehículos');
  const createdVehicles = [];
  for (const v of VEHICLES_DATA) {
    const body = { plate:v.plate, brand:v.brand, model:v.model, year:v.year, type:v.type, capacity:v.capacity, available:v.available };
    if (v.vin) body.vin = v.vin;
    if (v.maintenanceDueDate) body.maintenanceDueDate = v.maintenanceDueDate;
    if (v.circulationPermitDueDate) body.circulationPermitDueDate = v.circulationPermitDueDate;
    if (v.technicalReviewDueDate) body.technicalReviewDueDate = v.technicalReviewDueDate;
    const r = await tryPost(`${v.brand} ${v.model} [${v.plate}]`, '/vehicles', body);
    if (r) createdVehicles.push(r);
  }

  // Obtener registros existentes para tener IDs completos
  h1('Fase 6: Sincronizar IDs existentes');
  let allUsers = createdUsers, allClients = createdClients, allVehicles = createdVehicles;
  try {
    const [fu, fc, fv] = await Promise.all([
      get('/users').catch(() => []),
      get('/clients').catch(() => []),
      get('/vehicles').catch(() => []),
    ]);
    const merge = (created, fetched) => {
      const map = new Map();
      for (const item of [...(fetched || []), ...created]) if (item?.id) map.set(item.id, item);
      return [...map.values()];
    };
    allUsers    = merge(createdUsers, fu);
    allClients  = merge(createdClients, fc);
    allVehicles = merge(createdVehicles, fv);
    ok(`${allUsers.length} usuarios · ${allClients.length} clientes · ${allVehicles.length} vehículos`);
  } catch { skip('No se pudieron obtener registros existentes'); }

  // Resolver IDs útiles
  const byEmail = (email) => allUsers.find(u => u.email === email);
  const byPlate = (plate) => allVehicles.find(v => v.plate === plate || v.plate === plate.replace(/(.{2})(.{2})(.{2})/,'$1$2$3'));
  const byName  = (n) => allClients.find(c => (c.company_name || c.companyName || '').includes(n));

  const driver1  = byEmail('pgonzalez@rutek.cl');
  const driver2  = byEmail('lsepulveda@rutek.cl');
  const peoneta1 = byEmail('slara@rutek.cl');
  const peoneta2 = byEmail('mfuentes@rutek.cl');
  const van      = byPlate('BCJK31');
  const camion   = byPlate('LMPT99');
  const crafter  = byPlate('FJRM22');
  const ripley   = byName('Ripley');
  const falabella= byName('Falabella');
  const sodimac  = byName('SODIMAC');

  note(`Driver1: ${driver1?.name ?? 'no encontrado'} (${driver1?.id?.slice(0,8)}…)`);
  note(`Van:     ${van?.plate ?? 'no encontrado'} (${van?.id?.slice(0,8)}…)`);

  // ── FASE 7: Rutas y Pedidos ──
  h1('Fase 7: Rutas y Pedidos');

  // ──────────────────────────────────────────────────────────
  // RUTA 1001 — COMPLETADA (ayer) — 7 pedidos (6 entregados, 1 rechazado)
  // ──────────────────────────────────────────────────────────
  note('Ruta 1001 — Completada (ayer)');
  const r1 = await tryPost('Crear ruta 1001', '/routes', {
    name: 'Ruta Santiago Norte — Ripley',
    code: '1001',
    notes: 'Despacho tiendas sector norte',
    ...(ripley ? { client_id: ripley.id } : {}),
    ...(driver1 ? { driver_id: driver1.id, driver_name: driver1.name } : {}),
    ...(van ? { vehicle_id: van.id, vehicle_plate: van.plate } : {}),
    start_time: isoDaysAgo(1),
  });

  const r1deliveries = [
    { clientName:'Ripley Mall Costanera',      street:'Av. Andrés Bello 2447',       city:'Providencia',  bultos:8,  priority:'high' },
    { clientName:'Ripley Patio Bellavista',     street:'Constitución 183',            city:'Recoleta',     bultos:5,  priority:'medium' },
    { clientName:'Ripley Mall Arauco Quilicura',street:'Américo Vespucio Norte 1737', city:'Quilicura',    bultos:12, priority:'medium' },
    { clientName:'Ripley Mall Plaza Vespucio',  street:'Av. Vicuña Mackenna 7110',    city:'La Florida',   bultos:3,  priority:'low' },
    { clientName:'Ripley Mall Alto Las Condes', street:'Av. Kennedy 9001',            city:'Las Condes',   bultos:6,  priority:'high' },
    { clientName:'Ripley San Bernardo',         street:'Av. Diego Portales 1400',     city:'San Bernardo', bultos:4,  priority:'low' },
  ];
  const r1rejected = { clientName:'Ripley Apumanque', street:'Av. Manquehue Sur 31', city:'Las Condes', bultos:2, priority:'medium', notes:'Local cerrado al momento de entrega' };

  const r1OrderIds = [];
  if (r1?.id) {
    for (const d of r1deliveries) {
      const o = await tryPost(`  Pedido ${d.clientName}`, '/orders',
        orderBody({ ...d, clientId:ripley?.id, routeId:r1.id, status:'in_transit', estimatedOffset:-1,
          driverId:driver1?.id, driverName:driver1?.name,
          peonetaId:peoneta1?.id, peonetaName:peoneta1?.name,
          vehicleId:van?.id, vehiclePlate:van?.plate }));
      if (o?.id) r1OrderIds.push({ id:o.id, name:d.clientName });
    }
    // Pedido rechazado
    const oRej = await tryPost(`  Pedido ${r1rejected.clientName} [rechazar]`, '/orders',
      orderBody({ ...r1rejected, clientId:ripley?.id, routeId:r1.id, status:'in_transit', estimatedOffset:-1,
        driverId:driver1?.id, driverName:driver1?.name,
        vehicleId:van?.id, vehiclePlate:van?.plate }));

    // Assign driver masivo (peoneta incluida)
    if (driver1?.id) {
      await tryPatch('  Asignar chofer/peoneta a ruta 1001', `/routes/${r1.id}/assign-driver`, {
        driver_id:   driver1.id,   driver_name:   driver1.name,
        peoneta_id:  peoneta1?.id, peoneta_name:  peoneta1?.name,
        vehicle_id:  van?.id,      vehicle_plate: van?.plate,
      });
    }

    // Entregar todos los pedidos de r1
    for (const { id, name } of r1OrderIds) {
      await tryPatch(`  Entregar: ${name}`, `/orders/${id}/deliver`, { rut:'12.345.678-9', receptor:'Recepcionista Tienda' });
    }
    // Rechazar el último
    if (oRej?.id) {
      await tryPatch(`  Rechazar: ${r1rejected.clientName}`, `/orders/${oRej.id}/reject`, { motivo:'nadie_en_recepcion', obs:'Local cerrado al llegar — intentado 2 veces' });
    }

    // Fotos de entrega + firma para cada pedido entregado
    for (const { id, name } of r1OrderIds) {
      const [r, g, b] = PHOTO_COLORS.entrega;
      await tryUpload(`  Foto entrega: ${name}`, `/orders/${id}/photos`, 'file',
        makePNG(r, g, b), 'image/png', 'entrega.png', { description:'Entrega confirmada en local' });
      const [rs, gs, bs] = PHOTO_COLORS.firma;
      await tryUpload(`  Firma: ${name}`, `/orders/${id}/signature`, 'file',
        makePNG(rs, gs, bs), 'image/png', 'firma.png');
    }
    // Foto de daño al pedido rechazado (si se creó)
    if (oRej?.id) {
      const [r, g, b] = PHOTO_COLORS.dano;
      await tryUpload(`  Foto daño: ${r1rejected.clientName}`, `/orders/${oRej.id}/photos`, 'file',
        makePNG(r, g, b), 'image/png', 'dano.png', { description:'Local cerrado — sin entrega' });
    }
  }

  // ──────────────────────────────────────────────────────────
  // RUTA 1002 — EN PROGRESO (hoy) — 6 pedidos (2 entregados, 4 en tránsito)
  // ──────────────────────────────────────────────────────────
  note('\nRuta 1002 — En Progreso (hoy)');
  const r2 = await tryPost('Crear ruta 1002', '/routes', {
    name: 'Ruta Santiago Centro — Falabella',
    code: '1002',
    notes: 'Prioridad zona céntrica',
    ...(falabella ? { client_id: falabella.id } : {}),
    ...(driver2 ? { driver_id: driver2.id, driver_name: driver2.name } : {}),
    ...(camion ? { vehicle_id: camion.id, vehicle_plate: camion.plate } : {}),
    start_time: new Date().toISOString(),
  });

  const r2items = [
    { clientName:'Falabella Alameda',      street:"Av. Libertador O'Higgins 920", city:'Santiago',   bultos:10, priority:'high',   deliver:true  },
    { clientName:'Falabella Merced',        street:'Merced 227',                  city:'Santiago',   bultos:7,  priority:'high',   deliver:true  },
    { clientName:'Falabella Parque Arauco', street:'Av. Kennedy 5413',            city:'Las Condes', bultos:15, priority:'medium', deliver:false },
    { clientName:'Falabella Plaza Egaña',   street:'Av. Tobalaba 8890',           city:'La Florida', bultos:9,  priority:'medium', deliver:false },
    { clientName:'Falabella Ñuñoa',        street:'Av. Irarrázaval 2640',        city:'Ñuñoa',      bultos:4,  priority:'low',    deliver:false },
    { clientName:'Falabella Vespucio Sur',  street:'Av. Vicuña Mackenna 7110',   city:'Macul',      bultos:20, priority:'urgent', deliver:false, notes:'Urgente — apertura de temporada' },
  ];

  if (r2?.id) {
    if (driver2?.id) {
      await tryPatch('  Asignar chofer/peoneta a ruta 1002', `/routes/${r2.id}/assign-driver`, {
        driver_id: driver2.id, driver_name: driver2.name,
        peoneta_id: peoneta2?.id, peoneta_name: peoneta2?.name,
        vehicle_id: camion?.id,   vehicle_plate: camion?.plate,
      });
    }
    for (const item of r2items) {
      const o = await tryPost(`  Pedido ${item.clientName}`, '/orders',
        orderBody({ ...item, clientId:falabella?.id, routeId:r2.id, status:'in_transit',
          driverId:driver2?.id, driverName:driver2?.name,
          peonetaId:peoneta2?.id, peonetaName:peoneta2?.name,
          vehicleId:camion?.id, vehiclePlate:camion?.plate }));
      if (o?.id && item.deliver) {
        await tryPatch(`  Entregar: ${item.clientName}`, `/orders/${o.id}/deliver`, { rut:'9.876.543-2', receptor:'Jefe Bodega' });
        const [r, g, b] = PHOTO_COLORS.entrega;
        await tryUpload(`  Foto: ${item.clientName}`, `/orders/${o.id}/photos`, 'file',
          makePNG(r, g, b), 'image/png', 'entrega.png', { description:'Entregado sin novedad' });
        const [rs, gs, bs] = PHOTO_COLORS.firma;
        await tryUpload(`  Firma: ${item.clientName}`, `/orders/${o.id}/signature`, 'file',
          makePNG(rs, gs, bs), 'image/png', 'firma.png');
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // RUTA 1003 — SIN INICIAR (mañana)
  // ──────────────────────────────────────────────────────────
  note('\nRuta 1003 — Sin Iniciar (programada mañana)');
  const r3 = await tryPost('Crear ruta 1003', '/routes', {
    name: 'Ruta Sur — SODIMAC',
    code: '1003',
    notes: 'Programada para mañana — confirmar horario',
    ...(sodimac ? { client_id: sodimac.id } : {}),
    ...(driver1 ? { driver_id: driver1.id, driver_name: driver1.name } : {}),
    ...(crafter ? { vehicle_id: crafter.id, vehicle_plate: crafter.plate } : {}),
  });

  const r3items = [
    { clientName:'SODIMAC La Pintana',  street:'Av. Observatorio 1100',            city:'La Pintana', bultos:22, priority:'medium' },
    { clientName:'SODIMAC San Miguel',  street:'Gran Av. J.M. Carrera 8401',       city:'San Miguel', bultos:18, priority:'high' },
    { clientName:'SODIMAC Puente Alto', street:'Av. Concha y Toro 50',             city:'Puente Alto',bultos:30, priority:'medium', notes:'Coordinar acceso con jefe bodega' },
    { clientName:'SODIMAC La Florida',  street:'Av. Vicuña Mackenna Ote. 6100',   city:'La Florida', bultos:11, priority:'low' },
  ];

  if (r3?.id) {
    if (driver1?.id) {
      await tryPatch('  Pre-asignar chofer a ruta 1003', `/routes/${r3.id}/assign-driver`, {
        driver_id: driver1.id, driver_name: driver1.name,
        peoneta_id: peoneta1?.id, peoneta_name: peoneta1?.name,
        vehicle_id: crafter?.id,  vehicle_plate: crafter?.plate,
      });
    }
    for (const item of r3items) {
      await tryPost(`  Pedido ${item.clientName}`, '/orders',
        orderBody({ ...item, clientId:sodimac?.id, routeId:r3.id, status:'pending', estimatedOffset:1 }));
    }
  }

  // ──────────────────────────────────────────────────────────
  // RUTA 1004 — COMPLETADA (hace 3 días) — todo entregado
  // ──────────────────────────────────────────────────────────
  note('\nRuta 1004 — Completada (hace 3 días)');
  const r4 = await tryPost('Crear ruta 1004', '/routes', {
    name: 'Ruta Oriente — Falabella',
    code: '1004',
    notes: 'Despacho completo sin incidencias',
    ...(falabella ? { client_id: falabella.id } : {}),
    ...(driver1 ? { driver_id: driver1.id, driver_name: driver1.name } : {}),
    ...(crafter ? { vehicle_id: crafter.id, vehicle_plate: crafter.plate } : {}),
    start_time: isoDaysAgo(3),
  });

  const r4items = [
    { clientName:'Falabella La Dehesa',    street:'Av. La Dehesa 1445',       city:'Lo Barnechea',bultos:6,  priority:'medium' },
    { clientName:'Falabella Apoquindo',     street:'Av. Apoquindo 4501',       city:'Las Condes',  bultos:14, priority:'high' },
    { clientName:'Falabella Movistar Arena',street:'Av. Eliodoro Yáñez 3467', city:'Providencia', bultos:8,  priority:'medium' },
    { clientName:'Falabella El Golf',       street:'Av. El Golf 150',          city:'Las Condes',  bultos:3,  priority:'low' },
    { clientName:'Falabella Titanium',      street:'Av. Isidora Goyenechea 3000',city:'Las Condes',bultos:11, priority:'high' },
  ];

  if (r4?.id) {
    if (driver1?.id) {
      await tryPatch('  Asignar chofer a ruta 1004', `/routes/${r4.id}/assign-driver`, {
        driver_id: driver1.id, driver_name: driver1.name,
        peoneta_id: peoneta2?.id, peoneta_name: peoneta2?.name,
        vehicle_id: crafter?.id,  vehicle_plate: crafter?.plate,
      });
    }
    for (const item of r4items) {
      const o = await tryPost(`  Pedido ${item.clientName}`, '/orders',
        orderBody({ ...item, clientId:falabella?.id, routeId:r4.id, status:'in_transit', estimatedOffset:-3,
          driverId:driver1?.id, driverName:driver1?.name,
          peonetaId:peoneta2?.id, peonetaName:peoneta2?.name,
          vehicleId:crafter?.id, vehiclePlate:crafter?.plate }));
      if (o?.id) {
        await tryPatch(`  Entregar: ${item.clientName}`, `/orders/${o.id}/deliver`, { rut:'15.678.901-3', receptor:'Encargado Bodega' });
        const [r, g, b] = PHOTO_COLORS.entrega;
        await tryUpload(`  Foto: ${item.clientName}`, `/orders/${o.id}/photos`, 'file',
          makePNG(r, g, b), 'image/png', 'entrega.png', { description:'Entregado — firma recibida' });
        // Foto adicional de recepción
        const [rr, gr, br] = PHOTO_COLORS.recepcion;
        await tryUpload(`  Foto recepción: ${item.clientName}`, `/orders/${o.id}/photos`, 'file',
          makePNG(rr, gr, br), 'image/png', 'recepcion.png', { description:'Guía firmada por receptor' });
        const [rs, gs, bs] = PHOTO_COLORS.firma;
        await tryUpload(`  Firma: ${item.clientName}`, `/orders/${o.id}/signature`, 'file',
          makePNG(rs, gs, bs), 'image/png', 'firma.png');
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // RUTA 1005 — CANCELADA
  // ──────────────────────────────────────────────────────────
  note('\nRuta 1005 — Cancelada');
  const r5 = await tryPost('Crear ruta 1005', '/routes', {
    name: 'Ruta Poniente — Ripley (cancelada)',
    code: '1005',
    notes: 'Cancelada por condiciones climáticas',
    ...(ripley ? { client_id: ripley.id } : {}),
  });
  if (r5?.id) {
    for (const item of [
      { clientName:'Ripley Maipú',    street:'Av. 5 de Abril 655',        city:'Maipú',    bultos:8, priority:'medium' },
      { clientName:'Ripley Cerrillos',street:'Av. P.A. Cerda 8901',       city:'Cerrillos', bultos:4, priority:'low' },
    ]) {
      await tryPost(`  Pedido ${item.clientName}`, '/orders',
        orderBody({ ...item, clientId:ripley?.id, routeId:r5.id, status:'pending', estimatedOffset:5 }));
    }
    await tryPatch('  Cancelar ruta 1005', `/routes/${r5.id}`, { status:'cancelled' });
  }

  // ── FASE 8: Pedidos sueltos (sin ruta asignada) ──
  // Los pedidos SIEMPRE requieren route_id, así que creamos una ruta "cola" y la dejamos pendiente
  h1('Fase 8: Cola de pedidos sin ruta efectiva');
  const rCola = await tryPost('Crear ruta cola (sin iniciar)', '/routes', {
    name: 'Cola sin asignar — Pendientes',
    notes: 'Pedidos en espera de asignación a ruta real',
  });
  if (rCola?.id) {
    const colas = [
      { clientName:'Ripley Mall Mirage',     clientId:ripley?.id,   street:'Av. E. Frei 6600',    city:'Maipú',    bultos:16, priority:'high',   notes:'',                          status:'pending' },
      { clientName:'SODIMAC Recoleta',       clientId:sodimac?.id,  street:'Av. Recoleta 2222',   city:'Recoleta', bultos:25, priority:'medium', notes:'Espera confirmación horario', status:'pending' },
      { clientName:'Ripley Express Vitacura',clientId:ripley?.id,   street:'Av. Vitacura 5250',   city:'Vitacura', bultos:5,  priority:'urgent', notes:'Entrega antes de las 14:00',  status:'pending' },
    ];
    for (const item of colas) {
      await tryPost(`  ${item.clientName} [${item.priority}]`, '/orders',
        orderBody({ ...item, routeId:rCola.id, estimatedOffset:2 }));
    }
  }

  // ── Fotos de ruta (galería /fotos) ──
  h1('Fase 9: Fotos de ruta (galería /fotos)');
  for (const [routeId, routeCode, routeDriver, items] of [
    [r1?.id, '1001', driver1?.name, [
      { type:'entrega',   clientName:'Ripley Mall Costanera',       orderCode:'ENT-001', desc:'Entrega completa tienda Costanera' },
      { type:'recepcion', clientName:'Ripley Patio Bellavista',     orderCode:'ENT-002', desc:'Recepcionado por encargado turno' },
      { type:'firma',     clientName:'Ripley Mall Arauco Quilicura',orderCode:'ENT-003', desc:'Firma receptor conforme' },
    ]],
    [r4?.id, '1004', driver1?.name, [
      { type:'entrega',   clientName:'Falabella La Dehesa',    orderCode:'ENT-010', desc:'Entrega en bodega principal' },
      { type:'recepcion', clientName:'Falabella Apoquindo',    orderCode:'ENT-011', desc:'Recibido por Jefa de Piso' },
      { type:'dano',      clientName:'Falabella Movistar Arena',orderCode:'ENT-012',desc:'Caja exterior con golpe menor — mercadería OK' },
      { type:'firma',     clientName:'Falabella El Golf',      orderCode:'ENT-013', desc:'Firma encargado bodega' },
    ]],
  ]) {
    if (!routeId) continue;
    for (const { type, clientName, orderCode, desc } of items) {
      const [r, g, b] = PHOTO_COLORS[type] ?? PHOTO_COLORS.otro;
      await tryUpload(
        `  [${type}] ${clientName}`,
        '/route-photos', 'file',
        makePNG(r, g, b), 'image/png', `${type}.png`,
        { route_id: routeId, type, description: desc, client_name: clientName, order_code: orderCode },
      );
    }
  }

  // ── Resumen ──
  console.log(`\n${c.bold}${c.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✓ Seed completado`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);

  console.log(`${c.bold}Credenciales para probar cada rol:${c.reset}`);
  const creds = [
    ['Admin (seed)',  SEED_ADMIN_EMAIL,     SEED_ADMIN_PASS],
    ['Operador',     'crojas@rutek.cl',     'Demo1234'],
    ['Chofer 1',     'pgonzalez@rutek.cl',  'Demo1234'],
    ['Chofer 2',     'lsepulveda@rutek.cl', 'Demo1234'],
    ['Peoneta 1',    'slara@rutek.cl',      'Demo1234'],
    ['Peoneta 2',    'mfuentes@rutek.cl',   'Demo1234'],
    ['Cliente',      'compras@ripley.cl',   'Demo1234'],
  ];
  for (const [label, email, pass] of creds) {
    console.log(`  ${c.cyan}${label.padEnd(14)}${c.reset}  ${email.padEnd(32)}  ${c.gray}${pass}${c.reset}`);
  }
  console.log('');
}

main().catch((e) => {
  console.error(`\n${c.red}Error fatal:${c.reset}`, e.message);
  process.exit(1);
});
