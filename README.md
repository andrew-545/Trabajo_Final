# BarberBooking / AgendaBarber

Prototipo de reservas y gestión de agenda para la barbería **Estilo & Corte**, con Node.js 20+, Express y una interfaz web responsive. Las reservas se mantienen en memoria y se reinician al reiniciar el servidor.

## Requisitos

- Node.js 20 o superior (incluye npm).

## Iniciar la aplicación

Desde la carpeta del proyecto:

```powershell
cd backend
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000). Express sirve la interfaz de `frontend` y la API desde el mismo puerto; no hace falta iniciar un segundo servidor ni configurar CORS en el navegador. Para desarrollo con reinicio automático, usa `npm run dev` en lugar de `npm start`.

## Ejecutar pruebas

Desde `backend`:

```powershell
npm test
```

Las pruebas usan el runner nativo `node:test` y cubren reserva exitosa, cruce de horario, campos incompletos, cambio de estado, ingresos y orden de la agenda.

## Probar el flujo

1. En **Agendar cita**, prueba una reserva libre para el 14/11/2026, por ejemplo con Mateo a las 16:00.
2. Prueba con Juan a las 14:00 del 14/11/2026: la aplicación debe mostrar que el horario está ocupado.
3. Envía el formulario sin nombre o teléfono para ver el error de validación.
4. Abre **Agenda del barbero**, selecciona Juan y el 14/11/2026; sus citas aparecerán ordenadas por hora.
5. Marca una cita como **Atendido** y verifica el resumen de citas e ingresos atendidos. También puedes cancelar o reagendar.

## API principal

- `GET /api/barberos` y `GET /api/servicios`: catálogos.
- `POST /api/reservas`: registra una reserva confirmada.
- `GET /api/reservas?barberoId=1&fecha=14/11/2026`: lista y filtra reservas.
- `GET /api/agenda?barberoId=1&fecha=14/11/2026`: agenda y resumen diario.
- `PATCH /api/reservas/:id/estado`: actualiza el estado a `Atendido`, `Cancelado` o `Reagendado`.
