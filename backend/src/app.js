const express = require("express");
const cors = require("cors");
const path = require("node:path");
const { barberos, servicios, gestorReservas } = require("./data/inicial");
const { ErrorAplicacion } = require("./services/GestorReservas");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/barberos", (_req, res) => res.json(barberos));
app.get("/api/servicios", (_req, res) => res.json(servicios));

app.get("/api/reservas", (req, res) => {
  const { barberoId, fecha } = req.query;
  res.json(gestorReservas.listarReservas({ barberoId, fecha }));
});

app.post("/api/reservas", (req, res, next) => {
  try {
    const reserva = gestorReservas.registrarReserva(req.body ?? {});
    res.status(201).json({
      mensaje: "Reserva confirmada.",
      reserva,
      barbero: barberos.find((item) => item.id === reserva.barberoId),
      servicio: servicios.find((item) => item.id === reserva.servicioId)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/agenda", (req, res) => {
  const { barberoId, fecha } = req.query;
  const filtros = { barberoId, fecha };
  const reservas = gestorReservas.listarReservas(filtros).map((reserva) => ({
    ...reserva,
    barbero: barberos.find((item) => item.id === reserva.barberoId),
    servicio: servicios.find((item) => item.id === reserva.servicioId)
  }));
  res.json({ reservas, resumen: gestorReservas.obtenerResumen(filtros) });
});

app.patch("/api/reservas/:id/estado", (req, res, next) => {
  try {
    const reserva = gestorReservas.cambiarEstado(req.params.id, req.body?.estado);
    res.json({ mensaje: "Estado actualizado.", reserva });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.resolve(__dirname, "..", "..", "frontend")));

app.use((error, _req, res, _next) => {
  if (error instanceof ErrorAplicacion) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "El cuerpo de la solicitud debe ser JSON válido." });
  }
  console.error(error);
  return res.status(500).json({ error: "Ocurrió un error interno al procesar la solicitud." });
});

module.exports = app;
