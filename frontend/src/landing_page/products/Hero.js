import React from 'react';
function Hero() {
    return (
        <div className="container border-bottom mb-5 page-content">
            <div className="text-center mt-5 pt-5 p-3">
                <h1>Technology</h1>
                <h3 className="text-muted mt-3 fs-4">
                    Sleek, modern and intuitive trading platforms
                </h3>
                <p className="mt-3 mb-5">
                    Check out our{" "}
                    <a href="" style={{ textDecoration: "none" }}>
                        investment offerings{" "}
                        <i className="fas fa-long-arrow-alt-right" aria-hidden="true"></i>
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Hero;