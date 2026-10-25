# Mini Keyboard Studio

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Español](README.es.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

Haz tuyo un teclado pequeño. Mini Keyboard Studio es una aplicación local para macOS que permite editar teclas, diales e iluminación y aplicar el mapa de teclas por USB.

**[Descargar para macOS Apple Silicon](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest)** · [Guía de desarrollo](docs/development.md)

Disponible en inglés, coreano, japonés, español, chino simplificado y chino tradicional. Cambie el idioma desde **Archivos y compartir** o el menú de la app.

![Editor de mapas de teclas de Mini Keyboard Studio](docs/images/studio-editor.jpg)

## Funciones

- **Tres capas.** Asigna teclas, combinaciones con modificadores, macros, controles multimedia y acciones del ratón a teclas y diales.
- **Atajos fáciles de encontrar.** Consulta referencias de VS Code, Slack, Google Meet, cmux, Chrome, Claude, controles del sistema, Forza Horizon 4 y Modern Warfare 4. Guarda un nombre descriptivo para cada función.
- **La orientación que prefieras.** Gira la disposición para adaptarla a la posición del teclado en tu escritorio.
- **Iluminación por tecla.** Elige entre 15 colores y **Apagado**, con un modo LED común para cada capa.
- **Guarda y comparte.** Conserva mapas localmente, importa y exporta JSON y comparte un enlace que contiene el perfil. La edición y los archivos locales funcionan sin conexión.
- **Aplicación con comprobación.** Crea una copia de las asignaciones antes de escribir y verifica los valores guardados mediante una nueva lectura. Incluye diagnóstico de pulsaciones.
- **Siempre a mano.** Cierra la ventana y vuelve al editor desde la barra de menús.

![Paleta LED por tecla y modo de capa](docs/images/studio-led.jpg)

## Primeros pasos

1. Descarga el DMG para Apple Silicon desde [Releases](https://github.com/kyungtaek/mini-keyboard-studio/releases/latest), mueve la aplicación a **Aplicaciones** y ábrela.
2. Conecta el teclado con un cable USB de datos y selecciona **Conectar teclado**.
3. Abre un ejemplo incluido o crea un mapa nuevo. Selecciona una tecla o un dial, asigna una función y, si quieres, configura sus colores y el modo LED de la capa.
4. Guarda el mapa y selecciona **Aplicar al dispositivo** cuando esté listo. Abrir un archivo o cambiar la aplicación de referencia no lo aplica automáticamente.

El catálogo opcional de GitHub utiliza autenticación en GitHub. Los ejemplos incluidos y los mapas locales no necesitan una cuenta de GitHub. Los atajos de juegos son propuestas: deben coincidir con la configuración del juego.

## Compatibilidad

El dispositivo verificado actualmente es el **Mini Keyboard de 16 teclas y 3 diales**, USB **514C:8850**, con el firmware probado. Se ofrecen otras disposiciones como candidatas; no todas se han probado con hardware real.

Los modos LED se muestran como **0–5** porque no se han verificado todos sus efectos visuales. Un cambio de modo puede necesitar una reconexión USB para hacerse visible; se ha observado que algunos cambios de color se reflejan al instante. La lectura de verificación confirma valores guardados, no todos los efectos visibles. Los mapas se aplican manualmente; no cambian según la aplicación que tenga el foco.
