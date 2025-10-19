"use client";
import React, { createContext, useContext } from "react";

type User = {
  id: string;
  email: string;
  given_name: string | null;
  family_name: string | null;
  image: string | null;
  plan: string;
  customerId: string | null;
};

type UserContextType = {
  user: User | null;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook principal que retorna tudo
export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context.user;
}

// Hooks específicos para conveniência
export function useUserId() {
  const user = useUser();
  return user?.id ?? null;
}

export function useUserPlan() {
  const user = useUser();
  return user?.plan ?? null;
}

export function useUserEmail() {
  const user = useUser();
  return user?.email ?? null;
}

export function useUserName() {
  const user = useUser();
  if (!user) return null;
  const givenName = user.given_name ?? '';
  const familyName = user.family_name ?? '';
  const fullName = (givenName + ' ' + familyName).trim();
  return fullName || null;
}

export function useUserShortName() {
  const user = useUser();
  if (!user) return null;
  const givenName = user.given_name?.[0] ?? '';
  const familyName = user.family_name?.[0] ?? '';
  const shortName = (givenName + ' ' + familyName).trim();
  return shortName || null;
}

export function useUserImage() {
  const user = useUser();
  return user?.image ?? null;
}