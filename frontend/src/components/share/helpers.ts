import swal from "sweetalert";

/**
 * Variable qu establece si el navegador soporta opción nativa de
 * compartir...
 */
export const SHARE_AVAILABLE = "share" in navigator;

/**
 * Mensaje que se muestra cuando el proceso de compartir ha sido éxitoso,
 * se usa tanto para la versión nativa, como para la versión custom...
 */
export const successMessage = () => {
  swal({
    title: "Thanks for sharing!",
    closeOnEsc: false,
    icon: "success",
    timer: 3000,
  });
};

/**
 * Función que ejecuta la acción nativa de compartir, previamente, se ha
 * validado que el browser la soporta...
 * @param data
 */
export const shareLink = (data: ShareData) => {
  navigator
    .share(data)
    .then((_) => successMessage())
    .catch(() => {
      swal({
        title: "Thanks for sharing!",
        text: "Sharing failed :(",
        closeOnEsc: false,
        icon: "error",
      });
    });
};
