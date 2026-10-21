import React, { useState } from "react";

import BuyActionWindow from "./BuyActionWindow";

const GeneralContext = React.createContext({
  openBuyWindow: (uid, mode) => {},
  closeBuyWindow: () => {},
});

export const GeneralContextProvider = (props) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [actionType, setActionType] = useState("BUY");

  const handleOpenBuyWindow = (uid, mode) => {
    setIsBuyWindowOpen(true);
    setSelectedStockUID(uid);
    setActionType(mode);
  };

  const handleCloseBuyWindow = () => {
    setIsBuyWindowOpen(false);
    setSelectedStockUID("");
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
      }}
    >
      {props.children}

      {isBuyWindowOpen && (
        <BuyActionWindow
          uid={selectedStockUID}
          mode={actionType}
        />
      )}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;