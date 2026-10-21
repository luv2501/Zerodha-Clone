import React from "react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <div className="container p-5 text-center">
      <div className="row">
        <img src="media/images/homeHero.png" alt="hero" className="mb-5" />
        <h1 className="mt-3">Invest in everything</h1>
        <p>
          Online platform to invest in stocks, derivatives, mutual funds, and
          more
        </p>
      </div>
      <Link
        to="/signup"
        className="p-2 btn btn-primary fs-5 mb-5"
        style={{ width: "20%", minWidth: "180px", margin: "0 auto", textDecoration: "none" }}
      >
        Signup Now
      </Link>
    </div>
  );
}

export default Hero;
