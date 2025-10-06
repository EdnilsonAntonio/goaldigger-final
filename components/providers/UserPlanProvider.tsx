"use client";
import React, { createContext, useContext } from "react";

type UserContextType = {
  plan: string | null;
  userId: string | null;
};

const UserPlanContext = createContext<UserContextType | null>(null);

export function UserPlanProvider({
  userPlan,
  userId,
  children,
}: {
  userPlan: string | null;
  userId: string | null;
  children: React.ReactNode;
}) {
  return (
    <UserPlanContext.Provider value={{ plan: userPlan, userId }}>
      {children}
    </UserPlanContext.Provider>
  );
}

export function useUserPlan() {
  const context = useContext(UserPlanContext);
  if (context === null) {
    throw new Error("useUserPlan must be used within a UserPlanProvider");
  }
  return context.plan;
}

export function useUserId() {
  const context = useContext(UserPlanContext);
  if (context === null) {
    throw new Error("useUserId must be used within a UserPlanProvider");
  }
  return context.userId;
}

// Hook opcional que retorna tudo de uma vez
export function useUser() {
  const context = useContext(UserPlanContext);
  if (context === null) {
    throw new Error("useUser must be used within a UserPlanProvider");
  }
  return context;
}