const Reserva = require("../models/Reserva");

const ESTADOS_VALIDOS = new Set(["Atendido", "Cancelado", "Reagendado"]);

class ErrorAplicacion extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.name = "ErrorAplicacion";
    this.status = status;
  }
}

class GestorReservas {
  constructor({ barberos, servicios, reservas }) {
    this.barberos = barberos;
    this.servicios = servicios;
    this.reservas = reservas;
    this.siguienteId = Math.max(0, ...reservas.map((reserva) => reserva.id)) + 1;
  }

  registrarReserva(datos) {
    const camposObligatorios = ["cliente", "telefono", "barberoId", "servicioId", "fecha", "hora"];
    const faltantes = camposObligatorios.filter((campo) => {
      const valor = datos[campo];
      return valor === undefined || valor === null || String(valor).trim() === "";
    });

    if (faltantes.length) {
      throw new ErrorAplicacion(`Faltan campos obligatorios: ${faltantes.join(", ")}.`);
    }

    const barberoId = Number(datos.barberoId);
    const servicioId = Number(datos.servicioId);
    if (!this.barberos.some((barbero) => barbero.id === barberoId)) {
      throw new ErrorAplicacion("El barbero seleccionado no existe.");
    }
    if (!this.servicios.some((servicio) => servicio.id === servicioId)) {
      throw new ErrorAplicacion("El servicio seleccionado no existe.");
    }
    if (!this.esFechaValida(datos.fecha)) {
      throw new ErrorAplicacion("La fecha debe tener el formato DD/MM/AAAA y ser válida.");
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.hora)) {
      throw new ErrorAplicacion("La hora debe tener el formato HH:mm.");
    }

    const hayCruce = this.reservas.some((reserva) =>
      reserva.barberoId === barberoId &&
      reserva.fecha === datos.fecha &&
      reserva.hora === datos.hora &&
      reserva.estado === "Confirmada"
    );

    if (hayCruce) {
      throw new ErrorAplicacion("El barbero ya tiene una cita en ese horario.", 409);
    }

    const reserva = new Reserva({
      ...datos,
      barberoId,
      servicioId,
      id: this.siguienteId++
    });
    this.reservas.push(reserva);
    return reserva;
  }

  listarReservas({ barberoId, fecha } = {}) {
    return this.reservas
      .filter((reserva) =>
        (barberoId === undefined || reserva.barberoId === Number(barberoId)) &&
        (fecha === undefined || reserva.fecha === fecha)
      )
      .slice()
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }

  cambiarEstado(id, estado) {
    if (!ESTADOS_VALIDOS.has(estado)) {
      throw new ErrorAplicacion("El estado debe ser Atendido, Cancelado o Reagendado.");
    }

    const reserva = this.reservas.find((elemento) => elemento.id === Number(id));
    if (!reserva) {
      throw new ErrorAplicacion("No se encontró la reserva solicitada.", 404);
    }

    reserva.estado = estado;
    return reserva;
  }

  obtenerResumen({ barberoId, fecha } = {}) {
    const reservas = this.listarReservas({ barberoId, fecha });
    const precioDe = (reserva) =>
      this.servicios.find((servicio) => servicio.id === reserva.servicioId)?.precio ?? 0;

    return {
      cantidadConfirmadas: reservas.filter((reserva) => reserva.estado === "Confirmada").length,
      cantidadAtendidas: reservas.filter((reserva) => reserva.estado === "Atendido").length,
      totalProyectado: reservas
        .filter((reserva) => reserva.estado === "Confirmada")
        .reduce((total, reserva) => total + precioDe(reserva), 0),
      totalAtendido: reservas
        .filter((reserva) => reserva.estado === "Atendido")
        .reduce((total, reserva) => total + precioDe(reserva), 0)
    };
  }

  esFechaValida(fecha) {
    const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
    if (!coincidencia) return false;
    const [, dia, mes, anio] = coincidencia;
    const fechaCalendario = new Date(Number(anio), Number(mes) - 1, Number(dia));
    return fechaCalendario.getFullYear() === Number(anio) &&
      fechaCalendario.getMonth() === Number(mes) - 1 &&
      fechaCalendario.getDate() === Number(dia);
  }
}

module.exports = { GestorReservas, ErrorAplicacion };
