const API_URL = "http://localhost:3000/api";
const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const reservaForm = document.querySelector("#reserva-form");
const barberoSelect = document.querySelector("#barbero-select");
const servicioSelect = document.querySelector("#servicio-select");
const agendaBarbero = document.querySelector("#agenda-barbero");
const fechaReserva = document.querySelector("#fecha-reserva");
const horaSelect = document.querySelector("#hora-select");
const agendaFecha = document.querySelector("#agenda-fecha");
const reservaFeedback = document.querySelector("#reserva-feedback");
const agendaFeedback = document.querySelector("#agenda-feedback");

function fechaEnFormatoAPI(fechaISO) {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

async function solicitar(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...opciones.headers }
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "No fue posible completar la solicitud.");
  return datos;
}

function mostrarFeedback(elemento, mensaje, esError = false) {
  elemento.textContent = mensaje;
  elemento.classList.toggle("error", esError);
  elemento.classList.add("visible");
}

function ocultarFeedback(elemento) {
  elemento.classList.remove("visible", "error");
  elemento.textContent = "";
}

function opcionesHora() {
  const seleccionActual = horaSelect.value;
  horaSelect.replaceChildren(new Option("Selecciona una hora", ""));
  for (let hora = 9; hora <= 18; hora += 1) {
    for (const minuto of [0, 30]) {
      if (hora === 18 && minuto > 0) continue;
      const valor = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
      horaSelect.add(new Option(valor, valor));
    }
  }
  if (seleccionActual) horaSelect.value = seleccionActual;
}

async function cargarCatalogos() {
  const [barberos, servicios] = await Promise.all([
    solicitar("/barberos"),
    solicitar("/servicios")
  ]);
  for (const barbero of barberos) {
    const texto = `${barbero.nombre} — ${barbero.especialidad}`;
    barberoSelect.add(new Option(texto, barbero.id));
    agendaBarbero.add(new Option(barbero.nombre, barbero.id));
  }
  for (const servicio of servicios) {
    const texto = `${servicio.nombre} · ${servicio.duracionMinutos} min · ${formatoMoneda.format(servicio.precio)}`;
    servicioSelect.add(new Option(texto, servicio.id));
  }
}

async function cargarAgenda() {
  const query = new URLSearchParams({
    barberoId: agendaBarbero.value,
    fecha: fechaEnFormatoAPI(agendaFecha.value)
  });
  try {
    const { reservas, resumen } = await solicitar(`/agenda?${query}`);
    document.querySelector("#resumen").innerHTML = `
      <div class="summary-item"><span>CITAS CONFIRMADAS</span><strong>${resumen.cantidadConfirmadas}</strong></div>
      <div class="summary-item"><span>CITAS ATENDIDAS</span><strong>${resumen.cantidadAtendidas}</strong></div>
      <div class="summary-item"><span>INGRESO PROYECTADO</span><strong>${formatoMoneda.format(resumen.totalProyectado)}</strong></div>
      <div class="summary-item"><span>INGRESO ATENDIDO</span><strong>${formatoMoneda.format(resumen.totalAtendido)}</strong></div>`;

    const lista = document.querySelector("#agenda-list");
    if (!reservas.length) {
      lista.innerHTML = '<p class="empty-state">No hay citas para este barbero y fecha.</p>';
      return;
    }
    lista.replaceChildren(...reservas.map(crearElementoReserva));
  } catch (error) {
    mostrarFeedback(agendaFeedback, error.message, true);
  }
}

function crearElementoReserva(reserva) {
  const cita = document.createElement("article");
  cita.className = "appointment";
  const hora = document.createElement("div");
  hora.className = "appointment-time";
  hora.textContent = reserva.hora;

  const informacion = document.createElement("div");
  informacion.className = "appointment-info";
  const cliente = document.createElement("strong");
  cliente.textContent = reserva.cliente;
  const detalle = document.createElement("span");
  detalle.textContent = `${reserva.servicio.nombre} · ${formatoMoneda.format(reserva.servicio.precio)} · ${reserva.telefono}`;
  informacion.append(cliente, detalle);

  const acciones = document.createElement("div");
  acciones.className = "appointment-actions";
  const estado = document.createElement("span");
  estado.className = `status ${reserva.estado.toLowerCase()}`;
  estado.textContent = reserva.estado.toUpperCase();
  acciones.append(estado);
  if (reserva.estado === "Confirmada") {
    for (const [valor, etiqueta] of [
      ["Atendido", "Atendido"],
      ["Cancelado", "Cancelar"],
      ["Reagendado", "Reagendar"]
    ]) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "button-small";
      boton.dataset.id = reserva.id;
      boton.dataset.estado = valor;
      boton.textContent = etiqueta;
      acciones.append(boton);
    }
  }
  cita.append(hora, informacion, acciones);
  return cita;
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const vista = tab.dataset.view;
    document.querySelectorAll(".tab").forEach((elemento) => elemento.classList.toggle("active", elemento === tab));
    document.querySelectorAll(".view").forEach((elemento) => elemento.classList.toggle("active", elemento.id === `${vista}-view`));
    document.querySelector(".tabs").classList.toggle("agenda-active", vista === "agenda");
    if (vista === "agenda") cargarAgenda();
  });
});

reservaForm.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  ocultarFeedback(reservaFeedback);
  const datos = Object.fromEntries(new FormData(reservaForm));
  datos.barberoId = Number(datos.barberoId);
  datos.servicioId = Number(datos.servicioId);
  datos.fecha = fechaEnFormatoAPI(datos.fecha);
  try {
    const resultado = await solicitar("/reservas", {
      method: "POST",
      body: JSON.stringify(datos)
    });
    const { reserva, barbero, servicio } = resultado;
    mostrarFeedback(
      reservaFeedback,
      `¡Cita confirmada! Código #${reserva.id} · ${barbero.nombre} · ${reserva.fecha} a las ${reserva.hora} · ${servicio.nombre}.`
    );
    reservaForm.reset();
    fechaReserva.value = "2026-11-14";
    opcionesHora();
  } catch (error) {
    mostrarFeedback(reservaFeedback, error.message, true);
  }
});

agendaBarbero.addEventListener("change", cargarAgenda);
agendaFecha.addEventListener("change", cargarAgenda);
document.querySelector("#agenda-list").addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button[data-estado]");
  if (!boton) return;
  ocultarFeedback(agendaFeedback);
  try {
    await solicitar(`/reservas/${boton.dataset.id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado: boton.dataset.estado })
    });
    await cargarAgenda();
  } catch (error) {
    mostrarFeedback(agendaFeedback, error.message, true);
  }
});

opcionesHora();
cargarCatalogos()
  .then(() => cargarAgenda())
  .catch((error) => mostrarFeedback(reservaFeedback, error.message, true));
