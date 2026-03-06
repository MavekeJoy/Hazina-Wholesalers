import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  // Sample product data - replace with your actual data
  const products = [
    {
      id: 1,
      name: "Detergents",
      category: "Cleaning Supplies",
      icon: "🧴",
    },
    {
      id: 2,
      name: "Cooking Oil",
      category: "Bulk Supplies",
      icon: "🛢️",
    },
    {
      id: 3,
      name: "Soap",
      category: "Personal Care",
      icon: "🧼",
    },
    {
      id: 4,
      name: "Grains",
      category: "Dry Goods",
      icon: "🍚",
    },
    {
      id: 5,
      name: "Sugar",
      category: "Bulk Supplies",
      icon: "🥄",
    },
    {
      id: 6,
      name: "See all",
      category: "Products",
      icon: "➕",
      highlight: true,
    },
  ];

  const handleProductClick = (product) => {
    if (product.id === 6) {
      // See all products button
      navigate("/products");
    }
  };

  return (
    <div className="bg-green-900 min-h-screen text-white">
      {/* NAVBAR */}
      <div className="flex items-center justify-between p-5 bg-green-800">
        <h1 className="text-2xl font-bold">🛒Hazina</h1>

        <div className="flex gap-4 items-center">
          <button className="bg-green-500 px-6 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2">
            <span className="text-xl">👤</span>
            Login
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="flex items-center justify-between px-16 py-20 bg-gradient-to-b from-green-800 to-green-900 rounded-b-3xl">
        {/* TEXT SIDE */}
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold leading-tight">
            We bring the products to your store
          </h1>

          <p className="mt-6 text-lg text-green-200">
            Get sustainably sourced wholesale products at up to 4% off your wholesale orders.
          </p>
        </div>

        {/* IMAGE SIDE */}
        <div className="w-200 h-120 bg-green-700 rounded-2xl flex items-center justify-center overflow-hidden">
          <img
            src="/src/Images/wholesale-product.png"
            alt="Wholesale Products"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="bg-gray-100 px-16 py-16">
        <div className="grid grid-cols-6 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`flex flex-col items-center justify-center p-6 rounded-lg transition hover:shadow-lg cursor-pointer ${
                product.highlight
                  ? "bg-green-400 text-white hover:bg-green-500"
                  : "bg-white text-black hover:bg-gray-50"
              }`}
            >
              <div className="text-4xl mb-3">{product.icon}</div>
              <h3 className="font-semibold text-center text-sm">
                {product.name}
              </h3>
              <p
                className={`text-xs text-center mt-1 ${
                  product.highlight ? "text-green-100" : "text-gray-500"
                }`}
              >
                {product.category}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Landing;