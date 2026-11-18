# toy-loops: la skill de animaciones de juguete

Animaciones en 3D de papel, tipo maqueta, hechas 100 % con Python y renderizadas en Blender. Claude es el actor.
Son bucles que se repiten sin corte (GIF y MP4), fotos hero para páginas web, y una versión web donde Claude te
sigue con los ojos. El look sale de tus referencias de `3d_ref\style2`, analizadas con la skill
`reference-video-analysis`. La forma de animar sigue los principios clásicos de Disney.

## Qué hay hecho

| Pieza | Dónde |
|---|---|
| Claude en la isla saludando al barco (8 s) | `toy3d\videos\claude_isla\` |
| Claude de campamento con el malvavisco (8 s) | `toy3d\videos\claude_fogata\` |
| Foto hero de Claude director, natural y azul (2400x1200) | `toy3d\videos\director_hero\` |
| Claude solo con ojos que siguen el mouse | `toy3d\web\claude_ojos\` (abre `index.html`) |
| El hero del director con ojos vivos | `toy3d\web\director_ojos\` |
| El modelo 3D de Claude (`claude.glb`) y los recortes PNG | `toy3d\web\modelo\` |

## Cómo se usa

Me pides la animación ("haz a Claude en X haciendo Y"). Yo hago el resto:
1. Te muestro 2 o 3 imágenes fijas del lugar, para que elijas.
2. Escribo la hoja de animación: qué pasa en cada frame y por qué.
3. Te muestro las poses clave.
4. Renderizo y paso el control de calidad: que el bucle cierre sin salto y que se mueva lo suficiente.
5. Te mando el GIF y el MP4.

Un bucle de 8 s tarda unos 2,5 minutos en tu PC.

Para mí, todo se hace con una sola orden desde `toy3d\skill\kit`:

```
python tools/make_loop.py <nombre>             todo: render, GIF 1080 y 720, MP4 x1 y x3, control de calidad
python tools/make_loop.py <nombre> --preview   vista rápida (1 de cada 8 frames)
```

## Qué necesita

- **Blender 5.2:** tu copia portable está en `anymation\tools\blender`. En otro PC se instala Blender y listo.
- **ffmpeg.**
- **Python con numpy y Pillow.**

## Para compartirla o subirla a GitHub

`toy-loops.zip` trae las instrucciones, las referencias y todo el código del kit. No trae los renders ni Blender.

Una cosa que decides tú: el personaje es la mascota de Anthropic (la de Claude Code). Para practicar está bien. Si
lo publicas, es fan art de una marca.
