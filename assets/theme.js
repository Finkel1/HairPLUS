(function () {
  "use strict";

  function closeColorDropdown(dd) {
    if (!dd) return;
    dd.classList.remove("is-open");
    var trigger = dd.querySelector("[data-color-dropdown-trigger]");
    var panel = dd.querySelector("[data-color-dropdown-panel]");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (panel) panel.hidden = true;
  }

  function formatArsPesos(amount) {
    var n = Math.round(amount);
    var s = String(n);
    var len = s.length;
    if (len <= 3) return "$" + s;
    var headLen = len % 3;
    if (headLen === 0) headLen = 3;
    var pos = headLen;
    var out = "$" + s.slice(0, headLen);
    for (var i = 0; i < 12; i++) {
      if (pos >= len) break;
      out += "." + s.slice(pos, pos + 3);
      pos += 3;
    }
    return out;
  }

  function getBundleTierForCount(count, pricing) {
    if (!pricing || count <= 0) return null;
    if (count <= 3) {
      if (count === 1) return pricing.tiers[0];
      if (count === 2) return pricing.tiers[1];
      return pricing.tiers[2];
    }
    return {
      qty: count,
      unit: pricing.tiers[2].unit,
      total: getBundleCyclicTotal(count, pricing),
    };
  }

  function getBundleUnitAmountForIndex(unitIndex, pricing) {
    if (!pricing || unitIndex <= 0) return 0;
    if (unitIndex === 1) return pricing.tiers[0].unit;
    if (unitIndex === 2) return pricing.tiers[1].unit;
    return pricing.tiers[2].unit;
  }

  function getBundleCyclicTotal(count, pricing) {
    if (!pricing || count <= 0) return 0;
    if (count === 1) return pricing.tiers[0].total;
    if (count === 2) return pricing.tiers[1].total;
    // 3 o más: cada unidad se mantiene en el precio del tier 3.
    return count * (pricing.unitAboveMax || pricing.tiers[2].unit);
  }

  function getBundleCompareTotal(count, pricing) {
    if (!pricing || count <= 0) return 0;
    if (count === 1) return pricing.compareSingle || 59899;
    return count * (pricing.compareUnit || 39899);
  }

  function initColorDropdowns(root) {
    var scope = root || document;

    scope.querySelectorAll("[data-color-dropdown]").forEach(function (dd) {
      if (dd.dataset.colorDropdownInit) return;
      dd.dataset.colorDropdownInit = "1";

      var select = dd.querySelector("[data-bundle-color-select]");
      var trigger = dd.querySelector("[data-color-dropdown-trigger]");
      var label = dd.querySelector("[data-color-dropdown-label]");
      var panel = dd.querySelector("[data-color-dropdown-panel]");
      var options = dd.querySelectorAll("[data-color-option]");
      if (!select || !trigger || !panel) return;

      function setValue(value, optionBtn, silent) {
        var empty = !value;
        select.value = empty ? "" : value;
        dd.classList.toggle("color-dropdown--empty", empty);
        if (label) {
          if (empty) {
            label.textContent = "Elegí color";
          } else if (optionBtn) {
            label.textContent = optionBtn.dataset.colorName || value;
          } else {
            label.textContent = value;
          }
        }
        options.forEach(function (opt) {
          var on = optionBtn ? opt === optionBtn : opt.dataset.value === value;
          opt.classList.toggle("is-selected", on);
          opt.setAttribute("aria-selected", on ? "true" : "false");
        });
        if (!silent) {
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      dd.applyColorValue = function (colorValue, silent) {
        if (!colorValue) {
          setValue("", null, silent);
          return;
        }
        var match = null;
        options.forEach(function (opt) {
          if (opt.dataset.value === colorValue) match = opt;
        });
        setValue(colorValue, match, silent);
      };

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        if (dd.classList.contains("is-open")) {
          closeColorDropdown(dd);
          return;
        }
        document.querySelectorAll("[data-color-dropdown].is-open").forEach(closeColorDropdown);
        dd.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        panel.hidden = false;
      });

      options.forEach(function (opt) {
        opt.addEventListener("click", function (e) {
          e.stopPropagation();
          if (opt.disabled || opt.classList.contains("is-sold-out")) return;
          setValue(opt.dataset.value, opt);
          closeColorDropdown(dd);
        });
      });
    });
  }

  if (!document.colorDropdownDocBound) {
    document.colorDropdownDocBound = true;
    document.addEventListener("click", function () {
      document.querySelectorAll("[data-color-dropdown].is-open").forEach(closeColorDropdown);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll("[data-color-dropdown].is-open").forEach(closeColorDropdown);
      }
    });
  }

  /* Menú móvil (burger) */
  document.querySelectorAll("[data-mobile-nav]").forEach(function (nav) {
    var openBtn = document.querySelector("[data-menu-open]");
    var closeEls = nav.querySelectorAll("[data-menu-close]");

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      nav.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.classList.toggle("mobile-nav-open", open);
      if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var firstLink = nav.querySelector(".mobile-nav__link, [data-menu-close]");
        if (firstLink) firstLink.focus();
      }
    }

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        setOpen(!nav.classList.contains("is-open"));
      });
    }

    closeEls.forEach(function (el) {
      el.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        if (openBtn) openBtn.focus();
      }
    });
  });

  /* Before / After slider */
  document.querySelectorAll("[data-before-after]").forEach(function (root) {
    if (root.dataset.beforeAfterInit) return;
    root.dataset.beforeAfterInit = "1";

    var pos = 50;
    var dragging = false;
    var clip = root.querySelector("[data-before-clip]");
    var handle = root.querySelector("[data-before-handle]");
    var clipImg = root.querySelector("[data-before-clip] img");

    function syncClipImageWidth() {
      var w = root.clientWidth;
      root.style.setProperty("--before-after-width", w + "px");
      if (clipImg) clipImg.style.width = w + "px";
    }

    function setPos(p) {
      pos = Math.max(0, Math.min(100, p));
      if (clip) clip.style.width = pos + "%";
      if (handle) handle.style.left = pos + "%";
      syncClipImageWidth();
    }

    function update(clientX) {
      var rect = root.getBoundingClientRect();
      if (rect.width <= 0) return;
      setPos(((clientX - rect.left) / rect.width) * 100);
    }

    root.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      root.setPointerCapture(e.pointerId);
      update(e.clientX);
    });
    root.addEventListener("pointermove", function (e) {
      if (dragging) update(e.clientX);
    });
    root.addEventListener("pointerup", function () {
      dragging = false;
    });
    root.addEventListener("pointercancel", function () {
      dragging = false;
    });

    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(syncClipImageWidth);
      ro.observe(root);
    } else {
      window.addEventListener("resize", syncClipImageWidth);
    }

    if (clipImg && !clipImg.complete) {
      clipImg.addEventListener("load", syncClipImageWidth);
    }
    if (root.querySelector(".before-after__img--after")) {
      var afterImg = root.querySelector(".before-after__img--after");
      if (!afterImg.complete) afterImg.addEventListener("load", syncClipImageWidth);
    }

    setPos(50);
  });

  /* FAQ accordion */
  document.querySelectorAll("[data-faq]").forEach(function (faq) {
    faq.querySelectorAll("[data-faq-trigger]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest("[data-faq-item]");
        var wasOpen = item.classList.contains("is-open");
        faq.querySelectorAll("[data-faq-item]").forEach(function (el) {
          el.classList.remove("is-open");
        });
        if (!wasOpen) item.classList.add("is-open");
      });
    });
  });

  /* Product gallery */
  document.querySelectorAll("[data-product-gallery]").forEach(function (gallery) {
    var main = gallery.querySelector("[data-gallery-main]");
    var slides = gallery.querySelectorAll("[data-gallery-slide]");
    var thumbs = gallery.querySelectorAll("[data-gallery-thumb]");
    var index = 0;
    var touchStartX = 0;
    var touchStartY = 0;

    function pauseNonActiveVideos() {
      slides.forEach(function (slide, i) {
        if (i === index) return;
        slide.querySelectorAll("video").forEach(function (video) {
          try {
            video.pause();
          } catch (e) {
            // ignore
          }
        });
      });
    }

    function show(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("hidden", i !== index);
      });
      thumbs.forEach(function (thumb, i) {
        thumb.classList.toggle("is-active", i === index);
      });
      pauseNonActiveVideos();
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var nextIndex = parseInt(thumb.dataset.galleryIndex, 10);
        if (!isNaN(nextIndex)) show(nextIndex);
      });
    });

    if (main && slides.length > 1) {
      main.addEventListener(
        "touchstart",
        function (e) {
          if (!e.changedTouches[0]) return;
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        },
        { passive: true },
      );

      main.addEventListener(
        "touchend",
        function (e) {
          if (!e.changedTouches[0]) return;
          var dx = e.changedTouches[0].screenX - touchStartX;
          var dy = e.changedTouches[0].screenY - touchStartY;
          if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
          if (dx > 0) show(index - 1);
          else show(index + 1);
        },
        { passive: true },
      );
    }

    if (slides.length) {
      show(0);
    } else if (thumbs.length) {
      thumbs[0].classList.add("is-active");
    }
  });

  var cartRoot = (window.Shopify && Shopify.routes && Shopify.routes.root) || "/";

  function shopifyCartErrorMessage(err) {
    if (!err) return "No pudimos agregar al carrito. Probá de nuevo.";
    if (err.description) return err.description;
    if (err.message) return err.message;
    return "No pudimos agregar al carrito. Probá de nuevo.";
  }

  function applyCartDrawerHtml(html) {
    if (!html) return false;
    var wrap = document.createElement("div");
    wrap.innerHTML = html;
    var newBody = wrap.querySelector("[data-cart-drawer-body]");
    var currentBody = document.querySelector("[data-cart-drawer-body]");
    if (!newBody || !currentBody) return false;
    currentBody.innerHTML = newBody.innerHTML;
    document.querySelectorAll("[data-cart-bundle]").forEach(function (root) {
      delete root.dataset.cartBundleInit;
    });
    if (typeof initAllCartBundles === "function") initAllCartBundles();
    return true;
  }

  function auraBundleProperties(colorValue) {
    return {
      _aura_bundle: "1",
      Color: colorValue || "",
    };
  }

  /* Product bundle + variant form */
  var form = document.getElementById("product-form");
  if (form && form.querySelector("[data-bundle-list]")) {
    var cfg = window.HairplusProductForm || {};
    var bundleList = form.querySelector("[data-bundle-list]");
    var variantsJson = document.querySelector("[data-product-variants-json]");
    var variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];
    var colorOptionIndex = parseInt(bundleList.dataset.colorOptionIndex, 10) || 0;
    var productId = parseInt(bundleList.dataset.productId, 10) || 0;
    function normalizeColor(value) {
      return value == null ? "" : String(value).trim().toLowerCase();
    }

    var stockByColor = {};
    var stockByColorNorm = {};
    var stockByVariantId = {};
    var stockJsonEl = document.querySelector("[data-variant-stock-json]");
    if (stockJsonEl) {
      try {
        JSON.parse(stockJsonEl.textContent).forEach(function (row) {
          if (!row) return;
          if (row.color) {
            stockByColor[row.color] = row;
            stockByColorNorm[normalizeColor(row.color)] = row;
          }
          if (row.id) stockByVariantId[Number(row.id)] = row;
        });
      } catch (e) {
        stockByColor = {};
        stockByColorNorm = {};
        stockByVariantId = {};
      }
    }
    var qtyInput = form.querySelector("[data-quantity]");
    var priceEl = form.querySelector("[data-product-price]");
    var compareEl = form.querySelector("[data-product-compare]");
    var stickyPrice = document.querySelector("[data-sticky-price]");
    var stickyMeta = document.querySelector("[data-sticky-meta]");
    var submitBtn = form.querySelector("[data-add-to-cart]");
    var addLabel = form.querySelector("[data-add-to-cart-label]");
    var stickyAdd = document.querySelector("[data-sticky-add]");
    var adding = false;
    var cartReservedByVariant = {};

    function refreshCartReserved() {
      return fetch(cartRoot + "cart.js", { headers: { Accept: "application/json" } })
        .then(function (res) {
          return res.json();
        })
        .then(function (cart) {
          var next = {};
          (cart.items || []).forEach(function (item) {
            if (productId && Number(item.product_id) !== productId) return;
            var vid = Number(item.variant_id);
            next[vid] = (next[vid] || 0) + item.quantity;
          });
          cartReservedByVariant = next;
          return cart;
        })
        .catch(function () {
          // Fallo transitorio (red/adblock): conservamos la última reserva
          // conocida en vez de vaciarla, para no inflar el stock disponible.
          return null;
        });
    }

    function findVariantByColor(colorValue) {
      if (!colorValue) return null;
      var target = normalizeColor(colorValue);
      return variants.find(function (variant) {
        return normalizeColor(variant.options[colorOptionIndex]) === target;
      });
    }

    function getColorDropdowns(card) {
      return card ? card.querySelectorAll("[data-color-dropdown]") : [];
    }

    function getStockRowForColor(colorValue) {
      if (!colorValue) return null;
      if (stockByColor[colorValue]) return stockByColor[colorValue];
      var norm = stockByColorNorm[normalizeColor(colorValue)];
      if (norm) return norm;
      var variant = findVariantByColor(colorValue);
      if (!variant) return null;
      return {
        id: variant.id,
        color: colorValue,
        available: variant.available,
        inventory_management: variant.inventory_management,
        inventory_policy: variant.inventory_policy,
        inventory_quantity:
          typeof variant.inventory_quantity === "number" ? variant.inventory_quantity : null,
      };
    }

    function getBaseInventoryForRow(row) {
      if (!row || !row.available) return 0;
      if (!row.inventory_management) return 9999;
      if (row.inventory_policy === "continue") return 9999;
      var q = row.inventory_quantity;
      if (typeof q === "number" && !isNaN(q)) return Math.max(0, q);
      return 0;
    }

    function getAvailableStockForColor(colorValue) {
      var row = getStockRowForColor(colorValue);
      if (!row) return 0;
      var base = getBaseInventoryForRow(row);
      var reserved = cartReservedByVariant[Number(row.id)] || 0;
      return Math.max(0, base - reserved);
    }

    function reserveVariantsInCart(items) {
      (items || []).forEach(function (item) {
        var id = Number(item.id);
        if (!id) return;
        cartReservedByVariant[id] = (cartReservedByVariant[id] || 0) + (item.quantity || 0);
      });
    }

    function countColorInCard(card, color, excludeSelect) {
      if (!card) return 0;
      var count = 0;
      card.querySelectorAll("[data-bundle-color-select]").forEach(function (sel) {
        if (excludeSelect && sel === excludeSelect) return;
        if (sel.value === color) count += 1;
      });
      return count;
    }

    function canAssignColorToSlot(color, card, slotSelect) {
      if (!color || getAvailableStockForColor(color) <= 0) return false;
      if (!card) return getAvailableStockForColor(color) > 0;
      var usedElsewhere = countColorInCard(card, color, slotSelect);
      return usedElsewhere + 1 <= getAvailableStockForColor(color);
    }

    function isColorSoldOutInSlot(color, card, slotSelect) {
      if (!color) return true;
      if (slotSelect && slotSelect.value === color) {
        return getAvailableStockForColor(color) <= 0;
      }
      return !canAssignColorToSlot(color, card, slotSelect);
    }

    function sortColorDropdownOptions(dd, card) {
      var list = dd.querySelector(".color-dropdown__list");
      var select = dd.querySelector("[data-bundle-color-select]");
      if (!list) return;

      var rows = Array.prototype.slice.call(list.children);
      rows.forEach(function (li, index) {
        li.dataset.colorSortIndex = String(index);
      });
      rows.sort(function (a, b) {
        var optA = a.querySelector("[data-color-option]");
        var optB = b.querySelector("[data-color-option]");
        var soldA = optA && (optA.disabled || optA.classList.contains("is-sold-out"));
        var soldB = optB && (optB.disabled || optB.classList.contains("is-sold-out"));
        if (soldA !== soldB) return soldA ? 1 : -1;
        return Number(a.dataset.colorSortIndex) - Number(b.dataset.colorSortIndex);
      });
      rows.forEach(function (li) {
        list.appendChild(li);
      });

      if (!select) return;
      var options = Array.prototype.slice.call(select.options).filter(function (opt) {
        return opt.value;
      });
      options.forEach(function (opt, index) {
        opt.dataset.colorSortIndex = String(index);
      });
      options.sort(function (a, b) {
        var soldA = a.disabled || isColorSoldOutInSlot(a.value, card, select);
        var soldB = b.disabled || isColorSoldOutInSlot(b.value, card, select);
        if (soldA !== soldB) return soldA ? 1 : -1;
        return Number(a.dataset.colorSortIndex) - Number(b.dataset.colorSortIndex);
      });
      options.forEach(function (opt) {
        select.appendChild(opt);
      });
    }

    function updateColorDropdownAvailability(root) {
      var scope = root || form;
      if (!scope) return;
      scope.querySelectorAll("[data-color-dropdown]").forEach(function (dd) {
        var select = dd.querySelector("[data-bundle-color-select]");
        var card = dd.closest("[data-bundle-option]");
        dd.querySelectorAll("[data-color-option]").forEach(function (opt) {
          var color = opt.dataset.value;
          if (!color) return;
          var soldOut = isColorSoldOutInSlot(color, card, select);
          var name = opt.dataset.colorName || color;
          var nameEl = opt.querySelector(".color-dropdown__option-name");
          opt.disabled = soldOut;
          opt.classList.toggle("is-sold-out", soldOut);
          opt.setAttribute("aria-disabled", soldOut ? "true" : "false");
          if (nameEl) {
            nameEl.textContent = soldOut ? name + " — Agotado" : name;
          }
        });
        if (select) {
          Array.prototype.forEach.call(select.options, function (opt) {
            if (!opt.value) return;
            opt.disabled = isColorSoldOutInSlot(opt.value, card, select);
          });
        }
        sortColorDropdownOptions(dd, card);
      });
    }

    // Color por defecto para autocompletar los slots del bundle.
    var DEFAULT_COLOR_PRIORITY = "negro";

    // Orden natural de colores (según el orden de las variantes del producto).
    var orderedColors = (function () {
      var list = [];
      var seen = {};
      variants.forEach(function (variant) {
        var color = variant.options[colorOptionIndex];
        var norm = normalizeColor(color);
        if (color && !seen[norm]) {
          seen[norm] = true;
          list.push(color);
        }
      });
      return list;
    })();

    // Negro primero, luego el resto en su orden natural.
    function getPreferredColorOrder() {
      var primary = [];
      var rest = [];
      orderedColors.forEach(function (color) {
        if (normalizeColor(color) === DEFAULT_COLOR_PRIORITY) primary.push(color);
        else rest.push(color);
      });
      return primary.concat(rest);
    }

    // Primer color del orden preferido que todavía se puede asignar a este slot
    // (con stock disponible descontando carrito y slots ya usados en la tarjeta).
    function getActiveDefaultColor(card, slotSelect) {
      var order = getPreferredColorOrder();
      for (var i = 0; i < order.length; i++) {
        if (canAssignColorToSlot(order[i], card, slotSelect)) return order[i];
      }
      return "";
    }

    function rebalanceBundleColors(card) {
      if (!card) return;
      var usage = {};
      form.dataset.bundleSyncing = "1";
      getColorDropdowns(card).forEach(function (dd) {
        var select = dd.querySelector("[data-bundle-color-select]");
        if (!select || !select.value) return;
        var color = select.value;
        if (getAvailableStockForColor(color) <= 0) {
          if (dd.applyColorValue) dd.applyColorValue("", true);
          return;
        }
        usage[color] = usage[color] || 0;
        if (usage[color] >= getAvailableStockForColor(color)) {
          if (dd.applyColorValue) dd.applyColorValue("", true);
        } else {
          usage[color] += 1;
        }
      });
      delete form.dataset.bundleSyncing;
    }

    function syncBundleSlotColors(card) {
      if (!card) return;
      form.dataset.bundleSyncing = "1";
      rebalanceBundleColors(card);
      // El color default se elige una sola vez (Negro; si no queda nada de
      // Negro, cae al siguiente color con stock). Se llenan los slots vacíos
      // con ese color hasta agotar su stock; el resto queda en "Elegí color".
      var activeDefault = "";
      getColorDropdowns(card).forEach(function (dd) {
        var sel = dd.querySelector("[data-bundle-color-select]");
        if (sel && sel.value) return;
        if (!activeDefault) activeDefault = getActiveDefaultColor(card, sel);
        if (activeDefault && canAssignColorToSlot(activeDefault, card, sel)) {
          if (dd.applyColorValue) dd.applyColorValue(activeDefault, true);
        }
      });
      delete form.dataset.bundleSyncing;
    }

    function getSelectedCard() {
      return form.querySelector("[data-bundle-option].is-selected");
    }

    function getSelectedQty() {
      var card = getSelectedCard();
      return card
        ? parseInt(card.dataset.qty, 10) || 1
        : parseInt(qtyInput && qtyInput.value, 10) || 1;
    }

    function findVariantForColor(colorValue) {
      var variant = findVariantByColor(colorValue);
      if (!variant) return null;
      if (variant.available) return variant;
      return variant;
    }

    function getLineItemsFromCard(card) {
      var selects = card.querySelectorAll("[data-bundle-color-select]");
      var qty = parseInt(card.dataset.qty, 10) || 1;
      var byVariant = {};

      if (!selects.length) {
        var fallback =
          variants.find(function (v) {
            return v.available;
          }) || variants[0];
        if (fallback) {
          byVariant[fallback.id] = {
            id: fallback.id,
            quantity: qty,
            properties: auraBundleProperties(""),
          };
        }
        return Object.keys(byVariant).map(function (key) {
          return byVariant[key];
        });
      }

      selects.forEach(function (sel) {
        if (!sel.value) return;
        var variant = findVariantForColor(sel.value);
        if (!variant) return;
        var id = String(variant.id);
        if (!byVariant[id]) {
          byVariant[id] = {
            id: variant.id,
            quantity: 0,
            properties: auraBundleProperties(sel.value),
          };
        }
        byVariant[id].quantity += 1;
      });

      return Object.keys(byVariant).map(function (key) {
        return byVariant[key];
      });
    }

    function updateUI() {
      var card = getSelectedCard();
      if (!card) return;
      var qty = getSelectedQty();
      var totalLabel = card.dataset.totalLabel || "";
      var compareLabel = (card.dataset.compareLabel || "").trim();
      var showCompare = qty > 1 && compareLabel.length > 0;

      if (qtyInput) qtyInput.value = qty;
      if (priceEl) priceEl.textContent = totalLabel;
      if (stickyPrice) stickyPrice.textContent = totalLabel;
      if (stickyMeta) stickyMeta.textContent = "Llevá " + qty + " · Envío gratis";

      form.querySelectorAll("[data-bundle-option]").forEach(function (opt) {
        var optQty = parseInt(opt.dataset.qty, 10) || 1;
        var optCompare = opt.querySelector(".bundle-option__compare");
        if (optCompare) optCompare.hidden = optQty <= 1;
      });

      if (compareEl) {
        if (showCompare) {
          compareEl.textContent = compareLabel;
          compareEl.hidden = false;
          compareEl.style.display = "";
        } else {
          compareEl.textContent = "";
          compareEl.hidden = true;
          compareEl.style.display = "none";
        }
      }

      var items = getLineItemsFromCard(card);
      var bundleQty = parseInt(card.dataset.qty, 10) || 1;
      var filledSlots = 0;
      card.querySelectorAll("[data-bundle-color-select]").forEach(function (sel) {
        if (sel.value) filledSlots += 1;
      });

      var stockOk = items.every(function (item) {
        var v = variants.find(function (x) {
          return x.id === item.id;
        });
        if (!v || !v.available) return false;
        var color = v.options[colorOptionIndex] || "";
        return item.quantity <= getAvailableStockForColor(color);
      });

      var canAdd = items.length > 0 && stockOk;
      var partialStock = bundleQty > 1 && filledSlots > 0 && filledSlots < bundleQty;

      if (submitBtn) submitBtn.disabled = !canAdd || adding;
      if (addLabel) {
        if (!canAdd) {
          addLabel.textContent = cfg.soldOutLabel || "Agotado";
        } else if (partialStock) {
          addLabel.textContent = "Agregar " + filledSlots + " al carrito";
        } else {
          addLabel.textContent = cfg.addToCartLabel || "Agregar al carrito";
        }
      }
    }

    function selectBundle(card) {
      form.querySelectorAll("[data-bundle-option]").forEach(function (el) {
        var on = el === card;
        el.classList.toggle("is-selected", on);
        var btn = el.querySelector("[data-bundle-select]");
        if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      refreshCartReserved().then(function () {
        syncBundleSlotColors(card);
        updateColorDropdownAvailability(form);
        updateUI();
      });
    }

    form.querySelectorAll("[data-bundle-select]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectBundle(btn.closest("[data-bundle-option]"));
      });
    });

    form.querySelectorAll("[data-bundle-color-select]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        if (form.dataset.bundleSyncing) return;
        var card = sel.closest("[data-bundle-option]");
        rebalanceBundleColors(card);
        updateColorDropdownAvailability(form);
        updateUI();
      });
    });

    initColorDropdowns(form);

    function syncBundleColorsFromStock() {
      return refreshCartReserved().then(function () {
        var selected = getSelectedCard();
        if (selected) syncBundleSlotColors(selected);
        updateColorDropdownAvailability(form);
        updateUI();
      });
    }

    var cartSyncTimer = null;
    function scheduleStockSync() {
      if (cartSyncTimer) clearTimeout(cartSyncTimer);
      cartSyncTimer = setTimeout(function () {
        cartSyncTimer = null;
        syncBundleColorsFromStock();
      }, 90);
    }

    document.addEventListener("aura:cart-updated", scheduleStockSync);

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") scheduleStockSync();
    });

    form.querySelectorAll("[data-color-dropdown-trigger]").forEach(function (btn) {
      btn.addEventListener(
        "click",
        function () {
          refreshCartReserved().then(function () {
            var card = btn.closest("[data-bundle-option]");
            if (card && card.classList.contains("is-selected")) {
              rebalanceBundleColors(card);
            }
            updateColorDropdownAvailability(form);
            updateUI();
          });
        },
        true,
      );
    });

    syncBundleColorsFromStock();

    function resyncStockUI() {
      var c = getSelectedCard();
      if (c) syncBundleSlotColors(c);
      updateColorDropdownAvailability(form);
      updateUI();
    }

    function findOverStockItem(items) {
      return items.find(function (item) {
        var v = variants.find(function (x) {
          return x.id === item.id;
        });
        if (!v || !v.available) return true;
        var color = v.options[colorOptionIndex] || "";
        return item.quantity > getAvailableStockForColor(color);
      });
    }

    function performAdd(items) {
      var sectionsUrl = window.location.pathname + window.location.search;
      return fetch(cartRoot + "cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          items: items,
          sections: "cart-drawer",
          sections_url: sectionsUrl,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw data;
            return data;
          });
        })
        .then(function (data) {
          adding = false;
          reserveVariantsInCart(items);
          return refreshCartReserved().then(function () {
            resyncStockUI();
            document.dispatchEvent(
              new CustomEvent("aura:cart-updated", { detail: { source: "add" } }),
            );
            if (addLabel && !submitBtn.disabled) {
              addLabel.textContent = cfg.addToCartLabel || "Agregar al carrito";
            }

            if (data.sections && data.sections["cart-drawer"]) {
              applyCartDrawerHtml(data.sections["cart-drawer"]);
            } else if (window.AuraCart && window.AuraCart.refresh) {
              return window.AuraCart.refresh();
            }

            return fetch(cartRoot + "cart.js", {
              headers: { Accept: "application/json" },
            }).then(function (res) {
              return res.json();
            });
          });
        })
        .then(function (cart) {
          if (
            cart &&
            typeof cart.item_count === "number" &&
            typeof updateHeaderCartCount === "function"
          ) {
            updateHeaderCartCount(cart.item_count);
          }
          if (window.AuraCart) window.AuraCart.open();
        })
        .catch(function (err) {
          adding = false;
          if (addLabel) addLabel.textContent = cfg.addToCartLabel || "Agregar al carrito";
          // Re-sincronizamos contra el stock real (p. ej. oversell rechazado
          // por agotarse en otra pestaña/canal) antes de avisar al cliente.
          refreshCartReserved().then(resyncStockUI);
          window.alert(shopifyCartErrorMessage(err));
        });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var card = getSelectedCard();
      if (!card || !submitBtn || submitBtn.disabled || adding) return;

      adding = true;
      submitBtn.disabled = true;
      if (addLabel) addLabel.textContent = "Agregando…";

      // Revalidamos contra el stock real justo antes de enviar, para detectar
      // ventas en otra pestaña/canal mientras el cliente elegía colores.
      refreshCartReserved().then(function () {
        var items = getLineItemsFromCard(card);
        if (!items.length) {
          adding = false;
          resyncStockUI();
          return;
        }
        if (findOverStockItem(items)) {
          adding = false;
          resyncStockUI();
          window.alert("El stock cambió mientras elegías. Revisá los colores seleccionados.");
          return;
        }
        return performAdd(items);
      });
    });

    if (stickyAdd) {
      stickyAdd.addEventListener("click", function () {
        if (submitBtn && !submitBtn.disabled) {
          form.requestSubmit();
        } else {
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    updateUI();
  }

  /* Reviews / quote carousels */
  function loadReviewSlideImage(slide) {
    if (!slide) return;
    var img = slide.querySelector("img[data-review-img]");
    if (!img || img.dataset.reviewLoaded === "true") return;
    var src = img.getAttribute("data-src");
    if (src) img.src = src;
    var srcset = img.getAttribute("data-srcset");
    if (srcset) img.srcset = srcset;
    var sizes = img.getAttribute("data-sizes");
    if (sizes) img.sizes = sizes;
    img.dataset.reviewLoaded = "true";
    img.removeAttribute("data-src");
    img.removeAttribute("data-srcset");
    img.removeAttribute("data-sizes");
  }

  document.querySelectorAll("[data-reviews-carousel]").forEach(function (carousel) {
    var slides = carousel.querySelectorAll("[data-review-slide]");
    if (!slides.length) return;

    var dots = carousel.querySelectorAll("[data-review-dot]");
    var prev = carousel.querySelector("[data-review-prev]");
    var next = carousel.querySelector("[data-review-next]");
    var swipeArea = carousel.querySelector("[data-review-swipe]") || carousel;
    var index = 0;
    var touchStartX = 0;
    var touchStartY = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle("hidden", n !== index);
      });
      dots.forEach(function (d, n) {
        d.classList.toggle("is-active", n === index);
      });
      loadReviewSlideImage(slides[index]);
      loadReviewSlideImage(slides[(index + 1) % slides.length]);
    }

    if (prev)
      prev.addEventListener("click", function () {
        show(index - 1);
      });
    if (next)
      next.addEventListener("click", function () {
        show(index + 1);
      });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });

    swipeArea.addEventListener(
      "touchstart",
      function (e) {
        if (!e.changedTouches[0]) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      },
      { passive: true },
    );

    swipeArea.addEventListener(
      "touchend",
      function (e) {
        if (!e.changedTouches[0]) return;
        var dx = e.changedTouches[0].screenX - touchStartX;
        var dy = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx > 0) show(index - 1);
        else show(index + 1);
      },
      { passive: true },
    );

    show(0);
  });

  /* Sticky CTA on product page */
  var stickyCta = document.querySelector("[data-sticky-cta]");
  var ctaAnchor = document.querySelector("[data-cta-anchor]");
  if (stickyCta && ctaAnchor && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        var stickyVisible = !entries[0].isIntersecting;
        stickyCta.classList.toggle("is-visible", stickyVisible);
        document.body.classList.toggle("has-sticky-cta", stickyVisible);
      },
      { rootMargin: "0px 0px -80% 0px" },
    );
    observer.observe(ctaAnchor);
  }

  if (stickyCta) {
    var stickyAddBtn = stickyCta.querySelector("[data-sticky-add]");
    if (stickyAddBtn) {
      stickyAddBtn.addEventListener("click", function () {
        var form = document.getElementById("product-form");
        var submit = form && form.querySelector("[data-add-to-cart]");
        if (submit && !submit.disabled) {
          submit.click();
        } else if (form) {
          form.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  /* Drawer del carrito */
  function updateHeaderCartCount(count) {
    document.querySelectorAll("[data-header-cart-count]").forEach(function (badge) {
      if (typeof count !== "number") return;
      if (count > 0) {
        badge.textContent = String(count);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    });
  }

  function getCartDrawer() {
    return document.querySelector("[data-cart-drawer]");
  }

  function setCartDrawerOpen(open) {
    var drawer = getCartDrawer();
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("cart-drawer-open", open);
    if (open) {
      var closeBtn = drawer.querySelector("[data-cart-drawer-close].cart-drawer__close");
      if (closeBtn) closeBtn.focus();
    }
  }

  function refreshCartDrawer() {
    var sectionsUrl = window.location.pathname + window.location.search;
    return fetch(cartRoot + "?sections=cart-drawer&sections_url=" + encodeURIComponent(sectionsUrl))
      .then(function (res) {
        if (!res.ok) throw new Error("No se pudo actualizar el carrito");
        return res.json();
      })
      .then(function (sections) {
        applyCartDrawerHtml(sections["cart-drawer"]);
      });
  }

  window.AuraCart = {
    open: function () {
      setCartDrawerOpen(true);
    },
    close: function () {
      setCartDrawerOpen(false);
    },
    refresh: function () {
      return refreshCartDrawer().then(function () {
        return fetch(cartRoot + "cart.js", { headers: { Accept: "application/json" } })
          .then(function (res) {
            return res.json();
          })
          .then(function (cart) {
            updateHeaderCartCount(cart.item_count);
            document.dispatchEvent(new CustomEvent("aura:cart-updated"));
            return cart;
          });
      });
    },
  };

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cart-drawer-open]")) {
      e.preventDefault();
      setCartDrawerOpen(true);
      return;
    }
    if (e.target.closest("[data-cart-drawer-close]")) {
      setCartDrawerOpen(false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && getCartDrawer() && getCartDrawer().classList.contains("is-open")) {
      setCartDrawerOpen(false);
    }
  });

  if (document.body.classList.contains("template-cart")) {
    fetch(cartRoot + "cart.js", { headers: { Accept: "application/json" } })
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        if (cart.item_count > 0 && window.AuraCart) window.AuraCart.open();
      });
  }

  function initAllCartBundles() {
    document.querySelectorAll("[data-cart-bundle]").forEach(initCartBundle);
  }

  /* Carrito + bundle (precios por cantidad, color por fila) */
  function initCartBundle(cartBundleRoot) {
    if (!cartBundleRoot || cartBundleRoot.dataset.cartBundleInit === "1") return;
    cartBundleRoot.dataset.cartBundleInit = "1";

    var bundleScope = cartBundleRoot.closest("[data-cart-drawer-body]") || document;
    var bundleHandle = cartBundleRoot.dataset.productHandle || "";
    var colorOptionIndex = parseInt(cartBundleRoot.dataset.colorOptionIndex, 10) || 0;
    var variantsJson = bundleScope.querySelector("[data-bundle-variants-json]");
    var pricingJson = bundleScope.querySelector("[data-bundle-pricing-json]");
    var variants = variantsJson ? JSON.parse(variantsJson.textContent) : [];
    var pricing = pricingJson ? JSON.parse(pricingJson.textContent) : null;
    var totalEl = cartBundleRoot.querySelector("[data-cart-bundle-total]");
    var compareTotalEl = cartBundleRoot.querySelector("[data-cart-compare-total]");
    var checkoutBtn = cartBundleRoot.querySelector("[data-cart-checkout]");
    var busy = false;

    function findVariantByColor(colorValue) {
      if (!colorValue) return null;
      return (
        variants.find(function (v) {
          return v.available && v.options[colorOptionIndex] === colorValue;
        }) ||
        variants.find(function (v) {
          return v.options[colorOptionIndex] === colorValue;
        })
      );
    }

    function countBundleItems(cart) {
      var n = 0;
      (cart.items || []).forEach(function (item) {
        if (item.handle === bundleHandle) n += item.quantity;
      });
      return n;
    }

    function countVariantQty(cart, variantId) {
      var n = 0;
      (cart.items || []).forEach(function (item) {
        if (item.handle === bundleHandle && item.variant_id === variantId) {
          n += item.quantity;
        }
      });
      return n;
    }

    function getVariantIdAtBundlePosition(cart, globalPos) {
      var current = 0;
      var found = 0;
      (cart.items || []).forEach(function (item) {
        if (item.handle !== bundleHandle) return;
        for (var q = 0; q < item.quantity; q++) {
          current += 1;
          if (current === globalPos) found = item.variant_id;
        }
      });
      return found;
    }

    function getBundleRowTotalForVariant(cart, variantId, pricingData) {
      var totalUnits = countBundleItems(cart);
      if (!pricingData || totalUnits <= 0) return 0;
      var grandTotal = getBundleCyclicTotal(totalUnits, pricingData);
      var weightSum = 0;
      var variantWeight = 0;
      for (var pos = 1; pos <= totalUnits; pos++) {
        var unitWeight = getBundleUnitAmountForIndex(pos, pricingData);
        weightSum += unitWeight;
        if (getVariantIdAtBundlePosition(cart, pos) === variantId) {
          variantWeight += unitWeight;
        }
      }
      if (weightSum <= 0) return 0;
      return Math.round((grandTotal * variantWeight) / weightSum);
    }

    function bundleLinesForVariant(cart, variantId) {
      return (cart.items || []).filter(function (item) {
        return item.handle === bundleHandle && item.variant_id === variantId;
      });
    }

    function getVariantMaxQty(variantId, row) {
      if (row && row.dataset.variantMax !== undefined && row.dataset.variantMax !== "") {
        var fromRow = parseInt(row.dataset.variantMax, 10);
        if (!isNaN(fromRow)) return fromRow;
      }
      var variant = variants.find(function (v) {
        return v.id === variantId;
      });
      if (!variant || !variant.inventory_management) return null;
      if (variant.inventory_policy === "continue") return null;
      if (typeof variant.inventory_quantity !== "number") return null;
      return Math.max(0, variant.inventory_quantity);
    }

    function updateRowQtyControls(row, lineQty, maxQty) {
      var upBtn = row.querySelector("[data-cart-line-qty-up]");
      var downBtn = row.querySelector("[data-cart-line-qty-down]");
      var atMax = maxQty !== null && lineQty >= maxQty;
      var atMin = lineQty <= 1;
      if (upBtn) {
        upBtn.disabled = atMax;
        upBtn.setAttribute("aria-disabled", atMax ? "true" : "false");
      }
      if (downBtn) {
        downBtn.disabled = atMin;
        downBtn.setAttribute("aria-disabled", atMin ? "true" : "false");
      }
    }

    function otherItemsTotal(cart) {
      var sum = 0;
      (cart.items || []).forEach(function (item) {
        if (item.handle !== bundleHandle) sum += item.final_line_price;
      });
      return sum;
    }

    function updateCartBundleUI(cart) {
      var bundleCount = countBundleItems(cart);
      var tier = getBundleTierForCount(bundleCount, pricing);
      var onlyBundle =
        cart.items.length > 0 &&
        cart.items.every(function (item) {
          return item.handle === bundleHandle;
        });

      cartBundleRoot.querySelectorAll(".cart-bundle__row--bundle").forEach(function (row) {
        var priceCell = row.querySelector("[data-line-display-price]");
        var variantId = parseInt(row.dataset.variantId, 10);
        var lineQty = countVariantQty(cart, variantId);
        if (priceCell && pricing && variantId > 0 && lineQty > 0) {
          priceCell.textContent = formatArsPesos(
            getBundleRowTotalForVariant(cart, variantId, pricing),
          );
        }
        var qtyVal = row.querySelector("[data-cart-line-qty-value]");
        if (qtyVal && lineQty > 0) {
          qtyVal.textContent = String(lineQty);
          row.dataset.lineQty = String(lineQty);
        }
        updateRowQtyControls(row, lineQty, getVariantMaxQty(variantId, row));
      });

      if (totalEl) {
        if (onlyBundle && pricing) {
          var extra = otherItemsTotal(cart);
          var bundleTotalPesos =
            getBundleCyclicTotal(bundleCount, pricing) + (extra > 0 ? Math.round(extra / 100) : 0);
          totalEl.textContent = formatArsPesos(bundleTotalPesos);
        } else if (typeof Shopify !== "undefined" && Shopify.formatMoney) {
          totalEl.textContent = Shopify.formatMoney(
            cart.total_price,
            window.AuraMoneyFormat || "${{amount}}",
          );
        } else {
          totalEl.textContent = formatArsPesos(Math.round(cart.total_price / 100));
        }
      }

      if (compareTotalEl) {
        if (onlyBundle && pricing && bundleCount > 1) {
          compareTotalEl.textContent = formatArsPesos(getBundleCompareTotal(bundleCount, pricing));
          compareTotalEl.hidden = false;
        } else if (onlyBundle && bundleCount === 1) {
          compareTotalEl.hidden = true;
        } else {
          compareTotalEl.hidden = true;
        }
      }
    }

    function fetchCart() {
      return fetch(cartRoot + "cart.js", {
        headers: { Accept: "application/json" },
      }).then(function (res) {
        return res.json();
      });
    }

    function finishCartRequest(options, cart) {
      options = options || {};
      busy = false;
      cartBundleRoot.classList.remove("is-busy");
      if (options.reload !== false) {
        if (getCartDrawer()) {
          refreshCartDrawer().then(function () {
            if (cart) updateHeaderCartCount(cart.item_count);
          });
          return;
        }
        window.location.reload();
        return;
      }
      if (cart) {
        updateCartBundleUI(cart);
        updateHeaderCartCount(cart.item_count);
      }
    }

    function cartChange(payload, options) {
      options = options || {};
      if (busy) return Promise.resolve();
      busy = true;
      cartBundleRoot.classList.add("is-busy");
      return fetch(cartRoot + "cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw data;
            return data;
          });
        })
        .then(function (data) {
          finishCartRequest(options, data);
          return data;
        })
        .catch(function (err) {
          finishCartRequest({ reload: false });
          var msg =
            err && err.message ? err.message : "No pudimos actualizar el carrito. Probá de nuevo.";
          window.alert(msg);
        });
    }

    function cartUpdate(updates, options) {
      options = options || {};
      if (busy) return Promise.resolve();
      busy = true;
      cartBundleRoot.classList.add("is-busy");
      return fetch(cartRoot + "cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ updates: updates }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw data;
            return data;
          });
        })
        .then(function (data) {
          finishCartRequest(options, data);
          return data;
        })
        .catch(function (err) {
          finishCartRequest({ reload: false });
          var msg =
            err && err.message ? err.message : "No pudimos actualizar el carrito. Probá de nuevo.";
          window.alert(msg);
        });
    }

    function buildVariantQtyUpdates(lines, newQty) {
      var updates = {};
      if (!lines.length) return updates;
      lines.forEach(function (item, index) {
        if (newQty <= 0) {
          updates[item.key] = 0;
        } else if (index === 0) {
          updates[item.key] = newQty;
        } else {
          updates[item.key] = 0;
        }
      });
      return updates;
    }

    function setVariantQty(variantId, newQty, row) {
      if (busy || !variantId) return Promise.resolve();
      return fetchCart()
        .then(function (cart) {
          var lines = bundleLinesForVariant(cart, variantId);
          var current = lines.reduce(function (sum, item) {
            return sum + item.quantity;
          }, 0);
          var maxQty = getVariantMaxQty(variantId, row);
          if (maxQty !== null && newQty > maxQty) newQty = maxQty;
          if (newQty > current && maxQty !== null && current >= maxQty) {
            updateCartBundleUI(cart);
            return cart;
          }
          if (newQty === current) {
            updateCartBundleUI(cart);
            return cart;
          }
          if (lines.length === 0) {
            if (newQty <= 0) {
              updateCartBundleUI(cart);
              return cart;
            }
            return cartChange({ id: variantId, quantity: newQty }, { reload: false });
          }
          var reloadPage = newQty <= 0;
          return cartUpdate(buildVariantQtyUpdates(lines, newQty), {
            reload: reloadPage,
          });
        })
        .catch(function () {
          window.alert("No pudimos leer el carrito. Probá de nuevo.");
        });
    }

    function getRowVariantId(row) {
      return parseInt(row.dataset.variantId, 10);
    }

    function getRowLineQty(row) {
      return parseInt(row.dataset.lineQty, 10) || 1;
    }

    cartBundleRoot.querySelectorAll("[data-cart-line-qty-up]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (busy || btn.disabled) return;
        var row = btn.closest(".cart-bundle__row--bundle");
        if (!row) return;
        var variantId = getRowVariantId(row);
        var qty = getRowLineQty(row);
        var maxQty = getVariantMaxQty(variantId, row);
        if (maxQty !== null && qty >= maxQty) return;
        setVariantQty(variantId, qty + 1, row);
      });
    });

    cartBundleRoot.querySelectorAll("[data-cart-line-qty-down]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (busy || btn.disabled) return;
        var row = btn.closest(".cart-bundle__row--bundle");
        if (!row) return;
        var qty = getRowLineQty(row);
        setVariantQty(getRowVariantId(row), qty <= 1 ? 0 : qty - 1, row);
      });
    });

    cartBundleRoot.querySelectorAll("[data-cart-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (busy) return;
        var row = btn.closest(".cart-bundle__row");
        if (!row) return;
        if (row.classList.contains("cart-bundle__row--bundle")) {
          setVariantQty(getRowVariantId(row), 0, row);
          return;
        }
        var line = parseInt(row.dataset.cartLine, 10);
        if (line) cartChange({ line: line, quantity: 0 });
      });
    });

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", function () {
        window.location.href = cartRoot + "checkout";
      });
    }

    var initialCart = bundleScope.querySelector("[data-cart-json]");
    if (initialCart) {
      try {
        var parsed = JSON.parse(initialCart.textContent);
        updateCartBundleUI(parsed);
        updateHeaderCartCount(parsed.item_count);
      } catch (e) {
        fetchCart().then(function (cart) {
          updateCartBundleUI(cart);
          updateHeaderCartCount(cart.item_count);
        });
      }
    } else if (!cartBundleRoot.dataset.empty) {
      fetchCart().then(function (cart) {
        updateCartBundleUI(cart);
        updateHeaderCartCount(cart.item_count);
      });
    }
  }

  initAllCartBundles();

  function scrollToPumperBundle() {
    var target =
      document.querySelector(".product-info__rating") ||
      document.getElementById("pumperbundle") ||
      document.querySelector("[data-cta-anchor]");
    if (!target) return;
    var headerOffset = 56;
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  document.querySelectorAll("[data-scroll-to-bundle]").forEach(function (btn) {
    btn.addEventListener("click", scrollToPumperBundle);
  });

  if (window.location.hash === "#pumperbundle") {
    window.requestAnimationFrame(function () {
      scrollToPumperBundle();
    });
  }
})();
