import { API_URL } from "../utils/constants";
import { useFetch } from "../hooks";
import Loading from "../components/loading";
import React, { useContext } from "react";
import type { IAuth } from "../interfaces";

const UserContext = React.createContext<IAuth | null>(null);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, loading, error } = useFetch(API_URL);

  if (loading) return <Loading />;

  const value = !error
    ? data
    : { isAuth: false, authOptions: [], serviceError: true };

  return (
    <UserContext.Provider value={value as IAuth}>
      {children}
    </UserContext.Provider>
  );
};

const useUserContext = (): IAuth => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
};

export { UserProvider, useUserContext };
