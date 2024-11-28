import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import CartProduct from "../component/cartProduct";
import emptyCartImage from "../assest/empty.gif";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const productCartItem = useSelector((state) => state.product.cartItem);
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [formDetails, setFormDetails] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    productName: productCartItem.map((item) => item.name).join(", "),
  });

  const totalPrice = productCartItem.reduce(
    (acc, curr) => acc + parseInt(curr.total),
    0
  );
  const totalQty = productCartItem.reduce(
    (acc, curr) => acc + parseInt(curr.qty),
    0
  );

  const isFormValid =
    formDetails.fullName && formDetails.email && formDetails.mobileNumber;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDetails({ ...formDetails, [name]: value });
  };

  const handlePayment = async () => {
    if (!isFormValid) {
      toast.error("Please fill in all the required details.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to make a payment.");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_SERVER_DOMIN}/api/payment/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: totalPrice }),
      });

      if (!res.ok) throw new Error("Failed to initiate payment");

      const data = await res.json();
      console.log("Order created:", data);
      handlePaymentVerify(data.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handlePaymentVerify = (data) => {
    if (!window.Razorpay) {
      toast.error("Razorpay is not loaded. Please try again later.");
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      name: "Your Store Name",
      description: "Test Transaction",
      order_id: data.id,
      handler: async (response) => {
        try {
          const res = await fetch(`${process.env.REACT_APP_SERVER_DOMIN}/api/payment/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...response,
              amount: totalPrice,
              ...formDetails,
            }),
          });

          if (!res.ok) throw new Error("Verification failed");

          const verifyData = await res.json();
          toast.success(verifyData.message || "Payment verified successfully");
        } catch (error) {
          console.error("Verification error:", error);
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      theme: { color: "#5f63b8" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Dynamically load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      console.log("Razorpay script loaded");
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <div className="p-2 md:p-4">
        <h2 className="text-lg md:text-2xl font-bold text-slate-600">
          Your Cart Items
        </h2>

        {productCartItem[0] ? (
          <div className="my-4 flex gap-3">
            {/* Display cart items */}
            <div className="w-full max-w-3xl ">
              {productCartItem.map((el) => {
                return (
                  <CartProduct
                    key={el._id}
                    id={el._id}
                    name={el.name}
                    image={el.image}
                    category={el.category}
                    qty={el.qty}
                    total={el.total}
                    price={el.price}
                  />
                );
              })}
            </div>

            {/* Total cart item */}
            <div className="w-full max-w-md ml-auto">
              <h2 className="bg-blue-500 text-white p-2 text-lg">Summary</h2>
              <div className="flex w-full py-2 text-lg border-b">
                <p>Total Qty :</p>
                <p className="ml-auto w-32 font-bold">{totalQty}</p>
              </div>
              <div className="flex w-full py-2 text-lg border-b">
                <p>Total Price</p>
                <p className="ml-auto w-32 font-bold">
                  <span className="text-red-500">₹</span> {totalPrice}
                </p>
              </div>

              {/* Payment Form */}
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formDetails.fullName}
                  onChange={handleInputChange}
                  className="border p-2"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formDetails.email}
                  onChange={handleInputChange}
                  className="border p-2"
                />
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="Mobile Number"
                  value={formDetails.mobileNumber}
                  onChange={handleInputChange}
                  className="border p-2"
                />
              </div>

              {/* Payment Button */}
              <button
                className={`bg-red-500 w-full text-lg font-bold py-2 text-white mt-2 ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={handlePayment}
                disabled={!user}
              >
                Payment
              </button>

            </div>
          </div>
        ) : (
          <div className="my-4">
            <img src={emptyCartImage} alt="Empty Cart" className="w-full" />
            <p className="text-center font-bold text-lg text-slate-500">
              No Items In Cart
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
