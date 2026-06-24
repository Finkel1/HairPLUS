# HairPLUS · Tema Shopify

Tema **Online Store 2.0** basado en la arquitectura de [aura-beauty-foundation](https://github.com/Finkel1/aura-beauty-foundation), adaptado para **HairPLUS** (grooming masculino).

## Estructura

```
layout/          theme.liquid + password
sections/        19 secciones modulares (hero, main-product, faq, etc.)
snippets/        23 snippets (bundle picker, icons, FAQ, carrito…)
assets/          base.css + theme.js
templates/       index.json, product.json, cart.json, 404.json
config/          settings del theme editor
locales/         traducciones
```

## Conectar con Shopify (GitHub)

1. **Online Store → Themes → Add theme → Connect from GitHub**
2. Repo: **`Finkel1/HairPLUS`** · Rama: **`main`**
3. Publicar el tema

## Producto

- Handle por defecto: `hairplus-polvo-capilar`
- Configurarlo en **Theme settings → Producto** o asignar en el admin

## Páginas

| Template | Contenido |
|---|---|
| `index.json` | Homepage: hero, problema, before/after, beneficios, FAQ, CTA |
| `product.json` | PDP: galería + bundles, testimonios, reviews, FAQ, CTA |

## Colores HairPLUS

| Token | Valor |
|---|---|
| Navy | `#0A2633` |
| Taupe | `#B8AA88` |
| Fondo | `#F9FAF8` |

## Desarrollo local (opcional)

El repo de referencia incluye prototipo React en `src/` — **no se despliega a Shopify**. El storefront es 100% Liquid + `base.css` + `theme.js`.

---

Diseño: HairPLUS · Junio 2026
