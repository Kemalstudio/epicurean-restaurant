import { createContext, useContext, useEffect, useState } from 'react';

// Delivery address chosen by the user (top bar "Change location" / delivery popup).
const LocationContext = createContext(null);
const KEY = 'ember_location_v1';

export function LocationProvider({ children }) {
  const [address, setAddress] = useState(() => localStorage.getItem(KEY) || '');
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (address) localStorage.setItem(KEY, address);
    else localStorage.removeItem(KEY);
  }, [address]);

  return (
    <LocationContext.Provider value={{ address, setAddress, popupOpen, openPopup: () => setPopupOpen(true), closePopup: () => setPopupOpen(false) }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationStore() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationStore must be used within LocationProvider');
  return ctx;
}
