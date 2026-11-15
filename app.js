const $ = (id) => document.getElementById(id);
const pesos = (n) => "$" + n.toLocaleString("es-MX");

// ---- Ajustes: se guardan en el celular y tienen prioridad sobre config.js ----
const CLAVE_AJUSTES = "calculadora-ajustes";
const DEFECTOS = JSON.parse(JSON.stringify(CONFIG)); // lo que dice config.js

// ruta dentro de CONFIG, etiqueta, y factor (los porcentajes se capturan como 15, no 0.15)
const CAMPOS_AJUSTES = [
  ["valorDiaTrabajo", "Día de trabajo ($)", 1],
  ["pagoDiarioAbuelo", "Pago del abuelo por día ($)", 1],
  ["pagoDiarioChalan", "Pago del chalán por día ($)", 1],
  ["luzPorDia", "Luz por día ($)", 1],
  ["entrega.Cerca", "Gasolina Cerca ($)", 1],
  ["entrega.Lejos", "Gasolina Lejos ($)", 1],
  ["margenes.normal", "Margen Precio normal (%)", 100],
  ["margenes.maximo", "Margen Máximo (%)", 100],
  ["colchonInterrupciones", "Colchón por interrupciones (%)", 100],
  ["puertas.precioNormal", "Precio por puerta de tambor ($)", 1],
  ["puertas.materialPorPuerta", "Material por puerta ($)", 1],
];

function leerRuta(obj, ruta) {
  return ruta.split(".").reduce((o, k) => o[k], obj);
}
function ponerRuta(obj, ruta, valor) {
  const partes = ruta.split(".");
  const ultimo = partes.pop();
  partes.reduce((o, k) => o[k], obj)[ultimo] = valor;
}

function leerGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_AJUSTES)) || null;
  } catch (e) {
    return null;
  }
}

function aplicarGuardados(guardados) {
  CAMPOS_AJUSTES.forEach(([ruta]) => {
    const v = guardados && guardados[ruta];
    ponerRuta(CONFIG, ruta, typeof v === "number" ? v : leerRuta(DEFECTOS, ruta));
  });
}

aplicarGuardados(leerGuardados());

// Botones de opción: uno activo por grupo
document.querySelectorAll("[data-grupo] .opciones").forEach((grupo) => {
  grupo.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    grupo.querySelectorAll("button").forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
  });
});

const valorDe = (grupo) =>
  document.querySelector(`[data-grupo="${grupo}"] .activo`).dataset.valor;


function redondear(n) {
  return Math.round(n / CONFIG.redondeo) * CONFIG.redondeo;
}

function calcular() {
  const material = parseFloat($("material").value);
  if (isNaN(material) || material < 0) {
    $("aviso").textContent = "Escribe cuánto cuesta el material";
    $("resultado").hidden = true;
    return;
  }
  const diasEscritos = parseFloat($("dias").value.replace(",", "."));
  if (isNaN(diasEscritos) || diasEscritos <= 0) {
    $("aviso").textContent = "Escribe cuántos días calcula";
    $("resultado").hidden = true;
    return;
  }
  $("aviso").textContent = "";

  // Con otros pedidos a la vez, el carpintero pierde tiempo en interrupciones
  const conOtros = valorDe("modo") !== "De corrido";
  const dias = conOtros ? diasEscritos * (1 + CONFIG.colchonInterrupciones) : diasEscritos;

  // El ajuste por cliente solo afecta la mano de obra (días × valor del día)
  const manoDeObra = dias * CONFIG.valorDiaTrabajo * (1 + CONFIG.cliente[valorDe("cliente")]);

  // Días de ayudantes: solo cuentan si alguien ayuda
  const quien = valorDe("quien");
  const diasAyudantes = quien === "Nadie" ? 0 : parseFloat($("dias-ayudantes").value.replace(",", ".")) || 0;
  const pagoDiario =
    quien === "Abuelo" ? CONFIG.pagoDiarioAbuelo :
    quien === "Abuelo y chalán" ? CONFIG.pagoDiarioAbuelo + CONFIG.pagoDiarioChalan : 0;
  const pagoAyudantes = diasAyudantes * pagoDiario;

  const esGrande = diasEscritos >= CONFIG.diasTrabajoGrande;

  let costo =
    material +
    manoDeObra +
    pagoAyudantes +
    (dias + diasAyudantes) * CONFIG.luzPorDia +
    CONFIG.desgasteHerramientas +
    CONFIG.entrega[valorDe("entrega")];

  if (esGrande) costo *= 1 + CONFIG.margenExtraTrabajoGrande;

  // "Pierdes" = solo el costo real, sin ganancia
  const normal = redondear(costo * (1 + CONFIG.margenes.normal));
  $("r-pierdes").textContent = pesos(redondear(costo));
  $("r-normal").textContent = pesos(normal);
  $("r-maximo").textContent = pesos(redondear(costo * (1 + CONFIG.margenes.maximo)));

  const dTxt = (n) => String(Math.round(n * 100) / 100);
  $("r-dias").textContent = conOtros
    ? `Días usados en la cuenta: ${dTxt(dias)} (${dTxt(diasEscritos)} + ${Math.round(CONFIG.colchonInterrupciones * 100)}% por otros pedidos)`
    : `Días usados en la cuenta: ${dTxt(dias)}`;

  $("grande").hidden = !esGrande;
  if (esGrande) {
    [["anticipo", "Anticipo"], ["avance", "Avance"], ["entrega", "Entrega"]].forEach(([k, nombre]) => {
      const p = CONFIG.pagos[k];
      $("p-" + k + "-t").textContent = `${nombre} ${Math.round(p * 100)}%`;
      $("p-" + k).textContent = pesos(redondear(normal * p));
    });
  }
  $("resultado").hidden = false;
  $("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

function nuevo() {
  $("material").value = "";
  $("dias").value = 1;
  $("dias-ayudantes").value = 0;
  document.querySelectorAll("[data-grupo] .opciones").forEach((grupo) => {
    grupo.querySelectorAll("button").forEach((b) => b.classList.remove("activo"));
    const inicial = { cliente: "Normal", quien: "Nadie", modo: "De corrido" }[grupo.parentElement.dataset.grupo] || "No";
    grupo.querySelector(`[data-valor="${inicial}"]`).classList.add("activo");
  });
  $("aviso").textContent = "";
  $("resultado").hidden = true;
}

$("ejemplo").hidden = !CONFIG.ejemploActivo;

$("calcular").onclick = calcular;
$("nuevo").onclick = nuevo;

// Pantallas: Mueble / Puertas / Ajustes
let pantallaActual = "mueble";
function mostrar(pantalla) {
  pantallaActual = pantalla;
  const enAjustes = pantalla === "ajustes";
  document.querySelector(".pestanas").hidden = enAjustes;
  document.querySelectorAll(".pestanas button").forEach((b) => b.classList.toggle("activo", b.dataset.pantalla === pantalla));
  $("pantalla-mueble").hidden = pantalla !== "mueble";
  $("pantalla-puertas").hidden = pantalla !== "puertas";
  $("pantalla-ajustes").hidden = !enAjustes;
  $("sin-ajustes").hidden = enAjustes || !!leerGuardados();
}
let ultimaPestana = "mueble";
document.querySelector(".pestanas").addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;
  ultimaPestana = boton.dataset.pantalla;
  mostrar(ultimaPestana);
});

$("p-material").value = CONFIG.puertas.materialPorPuerta;

function calcularPuertas() {
  const P = CONFIG.puertas;
  const cantidad = parseInt($("p-cantidad").value, 10);
  const material = parseFloat($("p-material").value);
  if (isNaN(cantidad) || cantidad < 1) {
    $("p-aviso").textContent = "Escribe cuántas puertas";
    $("p-resultado").hidden = true;
    return;
  }
  if (isNaN(material) || material < 0) {
    $("p-aviso").textContent = "Escribe el material por puerta";
    $("p-resultado").hidden = true;
    return;
  }
  $("p-aviso").textContent = "";

  const diasCarpintero =
    cantidad * P.diasCarpinteriaPorPuerta + (valorDe("instalada") === "Sí" ? P.diasInstalacion : 0);
  const diasBarniz = cantidad * P.diasBarnizPorPuerta;
  const total =
    cantidad * material +
    diasCarpintero * CONFIG.valorDiaTrabajo +
    diasBarniz * CONFIG.pagoDiarioAbuelo +
    (diasCarpintero + diasBarniz) * CONFIG.luzPorDia +
    CONFIG.entrega.Cerca;
  const porPuerta = total / cantidad;

  const conDescuento = cantidad >= P.desdePuertasDescuento;
  const precio = P.precioNormal - (conDescuento ? P.descuentoPorPuerta : 0);
  const margen = porPuerta > 0 ? (precio - porPuerta) / porPuerta : 0;

  $("pr-total").textContent = pesos(redondear(total));
  $("pr-costo-puerta").textContent = pesos(redondear(porPuerta));
  $("pr-precio").textContent = pesos(precio);
  $("pr-descuento").hidden = !conDescuento;
  $("pr-descuento").textContent = `Descuento de ${pesos(P.descuentoPorPuerta)} por puerta (${cantidad} puertas)`;
  const bajo = margen < P.margenMinimo;
  const sobra = precio * cantidad - redondear(total); // precio del pedido menos costo total
  const aviso = $("pr-margen");
  aviso.classList.remove("ok", "cafe");
  if (!bajo) {
    aviso.textContent = `Margen: ${(margen * 100).toFixed(1)}%`;
    aviso.classList.add("ok");
  } else if (sobra >= 0) {
    aviso.textContent =
      `Con este pedido te quedan ${pesos(sobra)} de ganancia sobre tu sueldo. ` +
      `Un día extra de trabajo cuesta ${pesos(CONFIG.valorDiaTrabajo)} y se come esa ganancia.`;
    aviso.classList.add("cafe");
  } else {
    aviso.textContent = "Con este precio pierdes dinero";
  }
  $("p-resultado").hidden = false;
  $("p-resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("p-calcular").onclick = calcularPuertas;
$("p-nuevo").onclick = () => {
  $("p-cantidad").value = "";
  $("p-material").value = CONFIG.puertas.materialPorPuerta;
  const grupo = document.querySelector('[data-grupo="instalada"] .opciones');
  grupo.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", b.dataset.valor === "No"));
  $("p-aviso").textContent = "";
  $("p-resultado").hidden = true;
};

// Pantalla de Ajustes
const camposDiv = $("ajustes-campos");
CAMPOS_AJUSTES.forEach(([ruta, etiqueta]) => {
  const label = document.createElement("label");
  label.className = "campo";
  label.innerHTML = `<span class="titulo"></span><input type="number" inputmode="decimal" min="0" step="any" data-ruta="${ruta}">`;
  label.querySelector(".titulo").textContent = etiqueta;
  camposDiv.appendChild(label);
});

const redondeaDec = (n) => Math.round(n * 1e6) / 1e6;

function llenarAjustes(fuente) {
  CAMPOS_AJUSTES.forEach(([ruta, , factor]) => {
    camposDiv.querySelector(`[data-ruta="${ruta}"]`).value = redondeaDec(leerRuta(fuente, ruta) * factor);
  });
}

function abrirAjustes() {
  llenarAjustes(CONFIG);
  $("ajustes-aviso").textContent = "";
  mostrar("ajustes");
  window.scrollTo(0, 0);
}

$("a-guardar").onclick = () => {
  const guardados = {};
  for (const [ruta, etiqueta, factor] of CAMPOS_AJUSTES) {
    const v = parseFloat(camposDiv.querySelector(`[data-ruta="${ruta}"]`).value.replace(",", "."));
    if (isNaN(v) || v < 0) {
      $("ajustes-aviso").textContent = `Revisa: ${etiqueta}`;
      return;
    }
    guardados[ruta] = redondeaDec(v / factor);
  }
  try {
    localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(guardados));
  } catch (e) {
    $("ajustes-aviso").textContent = "No se pudo guardar en este navegador";
    return;
  }
  aplicarGuardados(guardados);
  $("p-material").value = CONFIG.puertas.materialPorPuerta;
  mostrar(ultimaPestana);
};

$("a-cerrar").onclick = () => mostrar(ultimaPestana);

// Restaurar: pide un segundo toque para no borrar por error
let confirmarRestaurar = null;
$("a-restaurar").onclick = () => {
  if (!confirmarRestaurar) {
    $("a-restaurar").textContent = "¿Seguro? Toca otra vez";
    confirmarRestaurar = setTimeout(() => {
      confirmarRestaurar = null;
      $("a-restaurar").textContent = "Restaurar";
    }, 4000);
    return;
  }
  clearTimeout(confirmarRestaurar);
  confirmarRestaurar = null;
  $("a-restaurar").textContent = "Restaurar";
  try { localStorage.removeItem(CLAVE_AJUSTES); } catch (e) {}
  aplicarGuardados(null);
  llenarAjustes(CONFIG);
  $("p-material").value = CONFIG.puertas.materialPorPuerta;
  $("ajustes-aviso").textContent = "";
};

// Toque largo (2 segundos) sobre el título abre Ajustes
let timerToque = null;
const cancelarToque = () => { clearTimeout(timerToque); timerToque = null; };
$("titulo").addEventListener("pointerdown", () => {
  cancelarToque();
  timerToque = setTimeout(() => { timerToque = null; abrirAjustes(); }, 2000);
});
["pointerup", "pointerleave", "pointercancel"].forEach((ev) => $("titulo").addEventListener(ev, cancelarToque));
$("titulo").addEventListener("contextmenu", (e) => e.preventDefault());

mostrar("mueble");
