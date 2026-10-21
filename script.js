/* ============================================================
   script.js — envío del formulario de contacto
   ============================================================

   Cuatro pasos, en este orden:

     1. preventDefault()  → el navegador no recarga la página.
     2. checkValidity()   → si falta un campo o el email está mal
                            formado, se avisa y NO se manda nada.
     3. fetch(action)     → POST a Formspree con los datos.
     4. Escribir el resultado en #form-status y volver a habilitar
        el botón, incluido cuando falla la conexión.

   El atributo action del <form> es el RESPALDO: si este archivo no
   cargara, el navegador envía el formulario igual por su cuenta.
   ============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  var estado = document.getElementById("form-status");

  // Sin estos dos nodos no hay nada que hacer: se sale sin romper.
  if (!form || !estado) return;

  var boton = form.querySelector('button[type="submit"]');

  function decir(texto, clase) {
    // textContent y no innerHTML: el mensaje sale como TEXTO, nunca
    // como HTML. Así, aunque el servicio devuelva algo raro, ese texto
    // no puede inyectar código en la página.
    estado.textContent = texto;
    estado.className = "form-status" + (clase ? " " + clase : "");
  }

  function ocupado(valor) {
    if (boton) boton.disabled = valor;
    form.setAttribute("aria-busy", valor ? "true" : "false");
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (!form.checkValidity()) {
      decir("Revisá los campos: faltan datos o el email no es válido.", "error");
      return;
    }

    ocupado(true);
    decir("Enviando...", "");

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (respuesta) {
        if (respuesta.ok) {
          decir("Mensaje enviado. ¡Gracias por escribir!", "ok");
          form.reset();
          return null;
        }

        // Formspree devuelve los errores como JSON con un arreglo
        // "errors". Si el cuerpo no es JSON, .catch lo deja pasar.
        return respuesta
          .json()
          .catch(function () {
            return {};
          })
          .then(function (datos) {
            var detalle = (datos.errors || [])
              .map(function (error) {
                return error.message;
              })
              .filter(Boolean)
              .join(" ");
            decir(
              "No se pudo enviar. " +
                (detalle || "Probá de nuevo en unos minutos."),
              "error"
            );
          });
      })
      .catch(function () {
        decir("No hay conexión: el mensaje no se envió.", "error");
      })
      .then(function () {
        // Se ejecuta en el camino feliz y en el de error: el botón
        // SIEMPRE vuelve, para no dejar al usuario con un botón muerto.
        ocupado(false);
      });
  });
})();
