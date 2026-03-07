import React, { createContext, useContext, useState } from 'react';

export type GoalType = 'save' | 'alerts' | 'trials';

interface OnboardingCtxValue {
  goal: GoalType | null;
  setGoal: (g: GoalType) => void;
  notifEnabled: boolean;
  setNotifEnabled: (v: boolean) => void;
}

const OnboardingContext = createContext<OnboardingCtxValue>({
  goal: null,
  setGoal: () => {},
  notifEnabled: true,
  setNotifEnabled: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <OnboardingContext.Provider value={{ goal, setGoal, notifEnabled, setNotifEnabled }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
