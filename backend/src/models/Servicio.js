class Servicio {
  constructor({ id, nombre, duracionMinutos, precio }) {
    this.id = Number(id);
    this.nombre = nombre;
    this.duracionMinutos = duracionMinutos;
    this.precio = precio;
  }
}

module.exports = Servicio;
