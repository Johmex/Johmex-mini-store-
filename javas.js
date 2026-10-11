// ======================================
// JOHMEX MINI STORE
// Supabase Database Connection
// ======================================

const SUPABASE_URL =
  "https://mmynzmnhnanroplznpyx.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_RQgeDYA-3eB95dHBBTyyPA_KVjutzjE";

// Replace with your real WhatsApp number.
// Nigerian example: 2348012345678
const WHATSAPP_NUMBER = "23480114949051";

// Website elements
const productGrid = document.getElementById("product-grid");
const statusBox = document.getElementById("status");
const cartItemsBox = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");

let products = [];
let cart = [];

// Format prices in Nigerian Naira
function naira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

// Protect the page when displaying database text
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Read common product column names
function productName(product) {
  return product.name ||
    product.product_name ||
    product.title ||
    "Unnamed Product";
}

function productPrice(product) {
  return Number(
    product.price ??
    product.amount ??
    product.product_price ??
    0
  );
}

function productImage(product) {
  return product.image_url ||
    product.image ||
    product.photo_url ||
    product.product_image ||
    "";
}

function productDescription(product) {
  return product.description ||
    product.details ||
    product.product_description ||
    "";
}

// ======================================
// LOAD PRODUCTS FROM SUPABASE
// Table name: product (singular)
// ======================================

async function loadProducts() {
  statusBox.textContent = "Loading products...";

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/product?select=*`,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();

      throw new Error(
        `Supabase error ${response.status}: ${errorDetails}`
      );
    }

    products = await response.json();

    displayProducts();

  } catch (error) {
    console.error("Product loading error:", error);

    statusBox.textContent =
      "Unable to load products. Check your Supabase table and permissions.";

    productGrid.textContent =
      "Products could not load. Check the browser console or send the error to ChatGPT.";
  }
}

// ======================================
// DISPLAY PRODUCTS
// ======================================

function displayProducts() {
  if (products.length === 0) {
    statusBox.textContent =
      "No products found. Add products to your product table.";

    productGrid.innerHTML = "";
    return;
  }

  statusBox.textContent =
    `${products.length} product(s) available`;

  productGrid.innerHTML = products.map((product, index) => {
    const name = productName(product);
    const image = productImage(product);

    return `
      <article class="product-card">

        ${
          image
            ? `
              <img
                class="product-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
              >
            `
            : `
              <div class="image-placeholder">
                JOHMEX FASHION
              </div>
            `
        }

        <div class="product-info">

          <h3>${escapeHTML(name)}</h3>

          <p class="description">
            ${escapeHTML(productDescription(product))}
          </p>

          <p class="price">
            ${naira(productPrice(product))}
          </p>

          <button
            class="add-button"
            data-index="${index}"
            type="button"
          >
            Add to Cart
          </button>

        </div>
      </article>
    `;
  }).join("");

  productGrid.querySelectorAll(".add-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        addToCart(Number(button.dataset.index));
      });
    });
}

// ======================================
// ADD PRODUCTS TO CART
// ======================================

function addToCart(index) {
  const product = products[index];

  if (!product) return;

  const existingItem = cart.find(
    item => item.product === product
  );

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      product: product,
      quantity: 1
    });
  }

  displayCart();
}

// ======================================
// DISPLAY SHOPPING CART
// ======================================

function displayCart() {
  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      productPrice(item.product) * item.quantity,
    0
  );

  cartCount.textContent = totalItems;
  cartTotal.textContent = naira(totalPrice);

  if (cart.length === 0) {
    cartItemsBox.textContent = "Your cart is empty.";
    return;
  }

  cartItemsBox.innerHTML = cart.map((item, index) => `
    <div class="cart-row">

      <div>
        <h4>${escapeHTML(productName(item.product))}</h4>
        <p>${naira(productPrice(item.product))} each</p>
      </div>

      <div class="quantity-controls">

        <button
          type="button"
          data-minus="${index}"
          aria-label="Decrease quantity"
        >−</button>

        <span>${item.quantity}</span>

        <button
          type="button"
          data-plus="${index}"
          aria-label="Increase quantity"
        >+</button>

      </div>
    </div>
  `).join("");

  cartItemsBox.querySelectorAll("[data-minus]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.minus);

        cart[index].quantity--;

        if (cart[index].quantity <= 0) {
          cart.splice(index, 1);
        }

        displayCart();
      });
    });

  cartItemsBox.querySelectorAll("[data-plus]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.plus);

        cart[index].quantity++;

        displayCart();
      });
    });
}

// ======================================
// WHATSAPP CHECKOUT
// ======================================

checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Please add a product to your cart first.");
    return;
  }

  if (WHATSAPP_NUMBER === "2348012345678") {
    alert(
      "Please replace the example WhatsApp number in script.js with your real business number."
    );
    return;
  }

  const orderDetails = cart.map(item => {
    const subtotal =
      productPrice(item.product) * item.quantity;

    return `${productName(item.product)} x ${item.quantity} - ${naira(subtotal)}`;
  });

  const total = cart.reduce(
    (sum, item) =>
      sum +
      productPrice(item.product) * item.quantity,
    0
  );

  const message =
    "Hello JOHMEX Mini Store! I want to place an order:\n\n" +
    orderDetails.join("\n") +
    "\n\nTotal: " + naira(total);

  const whatsappURL =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);

  window.open(whatsappURL, "_blank");
});

// ======================================
// START THE STORE
// ======================================

displayCart();
loadProducts();
