import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Import all product images
import oliveOil from "../Images/olive-oil.jpg";
import sunflowerOil from "../Images/sunflower-oil.jpeg";
import coconutOil from "../Images/coconut-oil.jpeg";
import bodyOilLavender from "../Images/body-oil-lavender.jpeg";
import bodyOilAlmond from "../Images/body-oil-almond.jpeg";
import soapNeem from "../Images/soap-neem.jpeg";
import soapCharcoal from "../Images/soap-charcoal.jpeg";
import soapAloe from "../Images/soap-aloe.jpeg";
import soapAntibacterial from "../Images/soap-antibacterial.jpeg";
import detergentPowder from "../Images/detergent-powder.jpeg";
import detergentLiquid from "../Images/detergent-liquid.jpeg";
import dishSoap from "../Images/dish-soap.jpeg";
import allPurposeCleaner from "../Images/all-purpose-cleaner.jpeg";
import whiteRice from "../Images/white-rice.jpeg";
import brownRice from "../Images/brown-rice.jpeg";
import basmatiRice from "../Images/basmati-rice.jpeg";
import wheatFlour from "../Images/wheat-flour.jpeg";
import maiseMeal from "../Images/maize-meal.jpg";

function Products() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart")) || []
  );

  // Product data organized by category
  const productCategories = {
    oils: [
      {
        id: 1,
        name: "Extra Virgin Olive Oil",
        category: "Cooking Oils",
        price: 450,
        image: oliveOil,
      },
      {
        id: 2,
        name: "Sunflower Oil",
        category: "Cooking Oils",
        price: 480,
        image: sunflowerOil,
      },
      {
        id: 3,
        name: "Coconut Oil",
        category: "Cooking Oils",
        price: 520,
        image: coconutOil,
      },
      {
        id: 4,
        name: "Body Oil - Lavender",
        category: "Body Oils",
        price: 580,
        image: bodyOilLavender,
      },
      {
        id: 5,
        name: "Body Oil - Almond",
        category: "Body Oils",
        price: 560,
        image: bodyOilAlmond,
      },
    ],
    soaps: [
      {
        id: 6,
        name: "Organic Soap Bar - Neem",
        category: "Soaps",
        price: 420,
        image: soapNeem,
      },
      {
        id: 7,
        name: "Organic Soap Bar - Charcoal",
        category: "Soaps",
        price: 440,
        image: soapCharcoal,
      },
      {
        id: 8,
        name: "Liquid Soap - Aloe Vera",
        category: "Soaps",
        price: 480,
        image: soapAloe,
      },
      {
        id: 9,
        name: "Antibacterial Soap",
        category: "Soaps",
        price: 450,
        image: soapAntibacterial,
      },
    ],
    detergents: [
      {
        id: 10,
        name: "Laundry Powder - 5kg",
        category: "Detergents",
        price: 680,
        image: detergentPowder,
      },
      {
        id: 11,
        name: "Laundry Liquid - 2L",
        category: "Detergents",
        price: 550,
        image: detergentLiquid,
      },
      {
        id: 12,
        name: "Dish Soap - 500ml",
        category: "Detergents",
        price: 620,
        image: dishSoap,
      },
      {
        id: 13,
        name: "All-Purpose Cleaner",
        category: "Detergents",
        price: 580,
        image: allPurposeCleaner,
      },
    ],
    grains: [
      {
        id: 14,
        name: "White Rice - 10kg",
        category: "Grains",
        price: 1200,
        image: whiteRice,
      },
      {
        id: 15,
        name: "Brown Rice - 10kg",
        category: "Grains",
        price: 1400,
        image: brownRice,
      },
      {
        id: 16,
        name: "Basmati Rice - 5kg",
        category: "Grains",
        price: 950,
        image: basmatiRice,
      },
      {
        id: 17,
        name: "Wheat Flour - 10kg",
        category: "Grains",
        price: 850,
        image: wheatFlour,
      },
      {
        id: 18,
        name: "Maize Meal - 10kg",
        category: "Grains",
        price: 720,
        image: maiseMeal,
      },
    ],
  };

  const addToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = existingCart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      existingCart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    setCart(existingCart);
    alert(`${product.name} added to cart!`);
  };

  const handleCartClick = () => {
    navigate("/checkout");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* NAVBAR */}
      <div className="flex items-center justify-between p-5 bg-green-800 text-white sticky top-0 z-50">
        <button
          onClick={() => navigate("/")}
          className="text-2xl font-bold cursor-pointer hover:opacity-80 transition"
        >
          🛒 Hazina
        </button>

        <input
          type="text"
          placeholder="Search Products..."
          className="w-1/3 px-4 py-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <div className="flex gap-4 items-center">
          <button
            onClick={handleCartClick}
            className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition cursor-pointer"
          >
            <span className="text-xl">🛒</span>
            <span className="font-semibold">{cart.length}</span>
          </button>

          <button className="bg-green-500 px-6 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2">
            <span className="text-xl">👤</span>
            Login
          </button>
        </div>
      </div>

      {/* PAGE TITLE */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-12 px-16">
        <h2 className="text-4xl font-bold">Our Products</h2>
        <p className="text-green-100 mt-2">
          Premium wholesale products for your store
        </p>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="px-16 py-12">
        {/* Cooking Oils Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-green-900 mb-8 flex items-center gap-3">
            <span className="text-4xl">🫒</span>
            Oils
          </h3>
          <div className="grid grid-cols-4 gap-6">
            {productCategories.oils.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Soaps Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-green-900 mb-8 flex items-center gap-3">
            <span className="text-4xl">🧼</span>
            Soaps
          </h3>
          <div className="grid grid-cols-4 gap-6">
            {productCategories.soaps.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Detergents Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-green-900 mb-8 flex items-center gap-3">
            <span className="text-4xl">🧽</span>
            Detergents
          </h3>
          <div className="grid grid-cols-4 gap-6">
            {productCategories.detergents.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>

        {/* Grains Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-green-900 mb-8 flex items-center gap-3">
            <span className="text-4xl">🍚</span>
            Grains & Flour
          </h3>
          <div className="grid grid-cols-4 gap-6">
            {productCategories.grains.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:scale-105">
      {/* Product Image Area */}
      <div className="bg-gradient-to-b from-green-100 to-green-50 h-56 flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-800 line-clamp-2">
          {product.name}
        </h4>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-green-700">
            Ksh {product.price}
          </span>
          <span className="text-xs text-gray-400">per unit</span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full mt-6 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
        >
          <span>🛒</span>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default Products;