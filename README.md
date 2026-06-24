# HairPLUS · Sección Shopify — Guía de instalación

## Archivos incluidos

```
sections/
  hairplus-landing.liquid   ← landing page (página independiente)
  hairplus-product.liquid   ← página de producto (template product)
templates/
  page.hairplus.json        ← template de página (landing)
  product.hairplus.json     ← template de producto
README.md                   ← este archivo
```

---

## Requisitos
- Shopify Online Store 2.0 (Dawn, Craft, Sense, Refresh, o cualquier tema moderno)
- Producto creado en Shopify con el handle `hairplus-polvo-capilar`

---

## Instalación paso a paso

### 1. Subir los archivos al tema

En **Shopify Admin → Online Store → Themes → (tu tema activo) → Edit code**:

- Arrastrar / pegar `hairplus-landing.liquid` y `hairplus-product.liquid` en la carpeta **`sections/`**
- Arrastrar / pegar `page.hairplus.json` y `product.hairplus.json` en la carpeta **`templates/`**
- Guardar todos los archivos.

### 2. Configurar el producto

Asegurate que el producto en Shopify tenga:
- **Handle:** `hairplus-polvo-capilar` *(Admin → Productos → abrí el producto → al fondo de la página)*
- **Precio de venta:** $39.990
- **Precio comparado:** $49.990 *(esto activa el precio tachado automáticamente)*
- **Variantes:** Negro · Castaño · Rubio · Gris *(aparecen como selector de color)*
- **Imágenes:** cargar imagen principal del producto

### 3. Asignar el template de producto

En **Admin → Productos → HairPLUS Polvo Capilar**:
- Al fondo de la página, en **"Theme template"**: elegir `product.hairplus`
- Guardar.

> **Alternativa — Landing como página independiente:**  
> Si preferís una landing separada del producto, creá una página en **Admin → Online Store → Pages → Add page**, elegí el template `page.hairplus` y usá esa URL para campañas.

### 4. Configurar en el Editor de Temas

En **Admin → Online Store → Themes → Customize**:
- Navegar al producto HairPLUS (o a la landing si usás `page.hairplus`).
- En el panel izquierdo verás **"HairPLUS Producto"** o **"HairPLUS Landing"** con todas las opciones.

#### Imágenes a cargar desde el editor:
| Setting | Imagen recomendada |
|---|---|
| Logo | `logo-horizontal-dark.png` |
| Imagen hero | `foto-modelo.png` (cuadrada) |
| Imagen de características | `producto-muestra.png` |
| Foto lifestyle | `foto-baño.png` |

#### Textos editables sin tocar código:
- Eyebrow, título y subtítulo del hero
- Prueba social ("★ 4.9/5 · +1.100 hombres ya lo usan")
- Cita sobre la foto lifestyle

#### Bloques (panel izquierdo → "Add block"):
- **Testimonio** — agregar/ordenar/eliminar reseñas de clientes
- **Pregunta frecuente** — agregar/ordenar/eliminar preguntas

---

## Notas técnicas

- **Fuente:** Inter cargada desde Google Fonts (inline en la sección, no requiere configuración adicional).
- **Colores:** hardcodeados en la sección (navy `#0A2633`, taupe `#B8AA88`, slate `#62717D`). Para cambiarlos, editar el bloque `<style>` al inicio del archivo `.liquid`.
- **Página de producto vs landing:** `hairplus-product.liquid` usa el objeto `product` nativo de Shopify (galería de imágenes, descripción, variantes). `hairplus-landing.liquid` carga el producto por handle y funciona en cualquier página.
- **Galería:** las imágenes vienen de las fotos del producto en Shopify. Al elegir un tono, cambia la imagen si la variante tiene foto asignada.
- **Barra sticky:** en la página de producto, al hacer scroll aparece una barra fija inferior con precio y botón de compra.
- **Add to cart:** todos los formularios comparten la variante seleccionada. El JS `hpSelectShade()` sincroniza inputs, precios y botones automáticamente.
- **Sin stock:** si el producto está agotado, los botones muestran "Sin stock" y se deshabilitan automáticamente.
- **Precios:** se formatean con el filtro `money_without_trailing_zeros` usando la moneda de la tienda. Si la tienda usa ARS, el símbolo `$` y el sufijo `ARS` aparecen correctamente.

---

## Soporte
Diseño: HairPLUS Design System · Junio 2026
