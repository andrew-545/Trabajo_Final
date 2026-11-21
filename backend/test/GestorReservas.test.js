const test = require("node:test");
const assert = require("node:assert/strict");
const Barbero = require("../src/models/Barbero");
const Servicio = require("../src/models/Servicio");
const Reserva = require("../src/models/Reserva");
const { GestorReservas } = require("../src/services/GestorReservas");

function crearGestor() {
  const barberos = [
    new Barbero({ id: 1, nombre: "Juan", especialidad: "Cortes" }),
    new Barbero({ id: 2, nombre: "Mateo", especialidad: "Barba" })
  ];
  const servicios = [
    new Servicio({ id: 1, nombre: "Corte", duracionMinutos: 30, precio: 25000 }),
    new Servicio({ id: 2, nombre: "Corte y barba", duracionMinutos: 60, precio: 40000 })
  ];
  const reservas = [
    new Reserva({
      id: 1, cliente: "Andrés López", telefono: "3001112233",
      barberoId: 1, servicioId: 1, fecha: "14/11/2026", hora: "14:00"
    }),
    new Reserva({
      id: 2, cliente: "Santiago Ruiz", telefono: "3004445566",
      barberoId: 2, servicioId: 2, fecha: "14/11/2026", hora: "15:00"
    })
  ];
  return new GestorReservas({ barberos, servicios, reservas });
}

test("reserva una cita disponible y aumenta el total", () => {
  const gestor = crearGestor();
  const reserva = gestor.registrarReserva({
    cliente: "Carlos Pérez",
    telefono: "3001234567",
    barberoId: 1,
    servicioId: 2,
    fecha: "14/11/2026",
    hora: "15:00"
  });

  assert.equal(reserva.estado, "Confirmada");
  assert.equal(gestor.reservas.length, 3);
});

test("rechaza el cruce horario con HTTP 409 y no agrega la reserva", () => {
  const gestor = crearGestor();

  assert.throws(
    () => gestor.registrarReserva({
      cliente: "Luis Gómez",
      telefono: "3009876543",
      barberoId: 1,
      servicioId: 1,
      fecha: "14/11/2026",
      hora: "14:00"
    }),
    (error) => error.status === 409 && /ya tiene una cita/.test(error.message)
  );
  assert.equal(gestor.reservas.length, 2);
});

test("rechaza datos incompletos sin detener la ejecución", () => {
  const gestor = crearGestor();

  assert.throws(
    () => gestor.registrarReserva({
      cliente: "",
      barberoId: 1,
      fecha: "14/11/2026",
      hora: "16:00"
    }),
    /campos obligatorios/
  );
  assert.equal(gestor.reservas.length, 2);
  assert.equal(gestor.registrarReserva({
    cliente: "Ana",
    telefono: "3002223344",
    barberoId: 1,
    servicioId: 1,
    fecha: "14/11/2026",
    hora: "16:00"
  }).estado, "Confirmada");
});

test("cambia el estado a Atendido y suma el ingreso del día", () => {
  const gestor = crearGestor();
  const reserva = gestor.cambiarEstado(1, "Atendido");
  const resumen = gestor.obtenerResumen({ barberoId: 1, fecha: "14/11/2026" });

  assert.equal(reserva.estado, "Atendido");
  assert.equal(resumen.cantidadAtendidas, 1);
  assert.equal(resumen.totalAtendido, 25000);
  assert.equal(resumen.totalProyectado, 0);
});

test("ordena agenda por hora y solo cuenta como cruce reservas confirmadas", () => {
  const gestor = crearGestor();
  gestor.cambiarEstado(1, "Cancelado");
  const reservaReagendada = gestor.registrarReserva({
    cliente: "Camila",
    telefono: "3005556677",
    barberoId: 1,
    servicioId: 1,
    fecha: "14/11/2026",
    hora: "14:00"
  });
  const agenda = gestor.listarReservas({ barberoId: 1, fecha: "14/11/2026" });

  assert.equal(reservaReagendada.estado, "Confirmada");
  assert.deepEqual(agenda.map((reserva) => reserva.hora), ["14:00", "14:00"]);
});
