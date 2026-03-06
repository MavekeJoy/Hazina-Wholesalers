import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem("cart")) || []);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Calculate prices
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const deliveryFee = subtotal > 2000 ? 0 : 200;
  const taxes = Math.round(subtotal * 0.16); // 16% tax
  const total = subtotal + deliveryFee + taxes - promoDiscount;

  const handleApplyPromo = () => {
    if (promoCode === "HAZINA10") {
      setPromoDiscount(Math.round(subtotal * 0.1));
      alert("Promo code applied! 10% discount");
    } else if (promoCode === "HAZINA20") {
      setPromoDiscount(Math.round(subtotal * 0.2));
      alert("Promo code applied! 20% discount");
    } else {
      alert("Invalid promo code");
    }
  };

  const handleConfirmOrder = () => {
    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }
    alert(`Order confirmed! Total: Ksh ${total}`);
    // Here you would typically send the order to your backend
    setCart([]);
    localStorage.removeItem("cart");
    navigate("/");
  };

  const handleRemoveItem = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleQuantityChange = (id, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: quantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* NAVBAR */}
      <div className="flex items-center justify-between p-5 bg-green-800 text-white sticky top-0 z-50">
        <button
          onClick={() => navigate("/")}
          className="text-2xl font-bold cursor-pointer hover:opacity-80"
        >
          🛒 Hazina
        </button>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => navigate("/products")}
            className="bg-green-500 px-6 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
          >
            <span>📦</span>
            Continue Shopping
          </button>

          <button className="bg-green-500 px-6 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2">
            <span className="text-xl">👤</span>
            Login
          </button>
        </div>
      </div>

      {/* PAGE TITLE */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-12 px-16">
        <h2 className="text-4xl font-bold">Checkout</h2>
        <p className="text-green-100 mt-2">Review and confirm your order</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-16 py-12 grid grid-cols-3 gap-8">
        {/* LEFT SIDE - Delivery & Items */}
        <div className="col-span-2 space-y-8">
          {/* DELIVERY INFORMATION */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Delivery information
              </h3>
              <button className="text-green-600 font-semibold hover:text-green-700 flex items-center gap-2">
                <span>✎</span> Edit
              </button>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                📍
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">
                  Delivery to
                </h4>
                <p className="text-gray-600 mt-1">Phone: (+254) 712-345-678</p>
                <p className="text-gray-600">
                  Nairobi, Westlands, Block A, Road 5, Kenya
                </p>
              </div>
            </div>
          </div>

          {/* REVIEW ITEMS BY STORE */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Review items by store
            </h3>

            {cart.length > 0 ? (
              <div className="space-y-6">
                <div className="border-b pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      H
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Hazina Wholesale
                      </h4>
                      <p className="text-sm text-gray-500">
                        Delivery in {deliveryFee === 0 ? "free" : "2-3 days"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl"
                      >
                        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>

                        <div className="flex-grow">
                          <h5 className="font-semibold text-gray-900">
                            {item.name}
                          </h5>
                          <p className="text-sm text-gray-500">{item.category}</p>
                          <p className="text-lg font-bold text-green-700 mt-1">
                            Ksh {item.price}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-300 px-3 py-1">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                (item.quantity || 1) - 1
                              )
                            }
                            className="text-gray-600 hover:text-gray-900 text-xl"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                (item.quantity || 1) + 1
                              )
                            }
                            className="text-gray-600 hover:text-gray-900 text-xl"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <button
                  onClick={() => navigate("/products")}
                  className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Order Summary */}
        <div className="col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-md sticky top-24 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Order summary</h3>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-green-600"
                />
                <span className="text-gray-700 font-medium">Online Payment</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-green-600"
                />
                <span className="text-gray-700 font-medium">
                  Cash on delivery
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="pos"
                  checked={paymentMethod === "pos"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-5 h-5 text-green-600"
                />
                <span className="text-gray-700 font-medium">POS on delivery</span>
              </label>
            </div>

            {/* Promo Code */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add Promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
              />
              <button
                onClick={handleApplyPromo}
                className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition font-semibold"
              >
                Apply
              </button>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">Ksh {subtotal}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery fee</span>
                <span className="font-semibold">
                  {deliveryFee === 0 ? "Free" : `Ksh ${deliveryFee}`}
                </span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Promo Discount</span>
                  <span className="font-semibold">-Ksh {promoDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Taxes (16%)</span>
                <span className="font-semibold">Ksh {taxes}</span>
              </div>

              <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3">
                <span>Total</span>
                <span className="text-green-700">Ksh {total}</span>
              </div>
            </div>

            {/* Buttons */}
            <button className="w-full border-2 border-gray-900 text-gray-900 py-3 rounded-full font-semibold hover:bg-gray-50 transition">
              Continue with M-Pesa
            </button>

            <button
              onClick={handleConfirmOrder}
              disabled={cart.length === 0}
              className="w-full bg-green-500 text-white py-3 rounded-full font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;