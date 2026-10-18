import React from 'react';
function Hero() {
    return ( 
       <div className='container p-5 text-center'>
        <div className='row '>
            <img src='media/images/homeHero.png' alt='hero' className='mb-5' />
            <h1 className='mt-3'>Invest in everything</h1>
            <p>
          Online platform to invest in stocks, derivatives, mutual funds, and
          more
        </p>
            </div>
            <button
          className="p-2 btn btn-primary fs-5 mb-5"
          style={{ width: "20%", margin: "0 auto" }}
        >
          Signup Now
        </button>
       </div>
     );
 }
 
 export default Hero;