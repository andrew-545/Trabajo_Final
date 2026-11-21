const Barbero = require("../models/Barbero");
const Servicio = require("../models/Servicio");
const Reserva = require("../models/Reserva");
const { GestorReservas } = require("../services/GestorReservas");

const barberos = [
  new Barbero({ id: 1, nombre: "Juan", especialidad: "Cortes clásicos y modernos" }),
  new Barbero({ id: 2, nombre: "Mateo", especialidad: "Barba y cuidado personal" })
];

const servicios = [
  new Servicio({ id: 1, nombre: "Corte de cabello", duracionMinutos: 30, precio: 25000 }),
  new Servicio({ id: 2, nombre: "Corte y barba", duracionMinutos: 60, precio: 40000 })
];

const reservas = [
  new Reserva({
    id: 1,
    cliente: "Andrés López",
    telefono: "3001112233",
    barberoId: 1,
    servicioId: 1,
    fecha: "14/11/2026",
    hora: "14:00"
  }),
  new Reserva({
    id: 2,
    cliente: "Santiago Ruiz",
    telefono: "3004445566",
    barberoId: 2,
    servicioId: 2,
    fecha: "14/11/2026",
    hora: "15:00"
  })
];

const gestorReservas = new GestorReservas({ barberos, servicios, reservas });

module.exports = { barberos, servicios, reservas, gestorReservas };
