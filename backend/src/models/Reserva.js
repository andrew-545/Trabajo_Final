class Reserva {
  constructor({ id, cliente, telefono, barberoId, servicioId, fecha, hora, estado = "Confirmada" }) {
    this.id = id;
    this.cliente = cliente;
    this.telefono = telefono;
    this.barberoId = Number(barberoId);
    this.servicioId = Number(servicioId);
    this.fecha = fecha;
    this.hora = hora;
    this.estado = estado;
    this.creadaEn = new Date().toISOString();
  }
}

module.exports = Reserva;
