# stage3d: la skill de shorts en 3D

Versión 0.1. Es el motor del clip v5 partido en dos: el **kit** (el look, que un video no puede tocar) y un **plan
de tomas** por video. Renderiza con la opción A (three.js puro), la que ganó la prueba en tu PC.

## Probarla en tu PC

Doble clic en `PROBAR.cmd`. Instala tres paquetes dentro de `kit` y hace el clip `pricetag_demo` con tu tarjeta
gráfica: revisa el plan, compila, renderiza, codifica con audio y pasa el control de calidad. El video queda en
`kit\out\pricetag_demo\pricetag_demo.mp4`.

Necesita Node 22 o más, ffmpeg en el PATH y Chrome o Edge. El control de calidad necesita Python con numpy y opencv
(`pip install numpy opencv-python`); si faltan, el video se hace igual y lo avisa.

## Hacer un video

Desde la carpeta `kit`:

```
node scripts/build.cjs <plan>                          revisa el plan y compila
node scripts/render.cjs <plan> stills 0,17,88 --gpu    imágenes de prueba
node scripts/make_video.cjs <plan> --gpu --workers=4   todo: render, audio, control de calidad
```

Para verlo moverse con sonido antes de renderizar: abre `kit\dist\<plan>\preview.html` en el navegador.

## Qué hay

| Carpeta | Qué es |
|---|---|
| `SKILL.md` | Las instrucciones que sigue Claude: el paso a paso y las reglas |
| `kit\src` | El look. No se edita para un video |
| `kit\plans` | Un plan por video. `pricetag_demo` es el clip v5; `test5` es una prueba de 5 s; `no_trick` es un short completo de 47 s (guion, voz, música, plan y fuentes) |
| `kit\scripts` | Compilar, renderizar, codificar, control de calidad |
| `kit\audio` | Efectos de sonido y mezcla |
| `references` | Biblia de estilo con los números, reglas de cámara, guía del plan, errores conocidos, frames meta |

## Lo que todavía no hace

No está probada con un video completo. Faltan tipos de toma que la referencia usa: recorrer una lista, el retroceso
que revela algo grande, barras y gráficas, varios personajes. La voz, la música y los tiempos de las palabras vienen
de tu pipeline `v2\v8`.
