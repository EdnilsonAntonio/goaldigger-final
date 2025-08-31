"use client";
import React, { createContext, useContext } from "react";
const UserPlanContext = createContext<string | null>(null);
export function UserPlanProvider({
  userPlan,
  children,
}: {
  userPlan: string | null;
  children: React.ReactNode;
}) {
  return (
    <UserPlanContext.Provider value={userPlan}>
      {children}
    </UserPlanContext.Provider>
  );
}
export function useUserPlan() {
  const context = useContext(UserPlanContext);
  if (context === undefined) {
    throw new Error("useUser Plan must be used within a UserPlanProvider");
  }
  return context;
}