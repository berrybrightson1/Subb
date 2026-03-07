---
name: Subb Manager
description: Guidelines and tools for building the Subb subscription manager app
---

# Subb Development Guidelines

You are assisting in the development of "Subb", a premium subscription manager app built with Expo, React Native, and Firebase.

## Core Directives

1. **Proactive Management Mentality**
   Always anticipate user needs regarding subscriptions. If implementing a feature or utility, naturally consider how it helps the user save money or avoid missed trial cancellations.
   Ensure the system can calculate billing cycles and specifically highlight/suggest cancellations if a subscription's `isTrial` flag is true.

2. **Design Language**
   - **Minimalist**: Keep UI components clean, with ample whitespace and clear typography.
   - **Dark Mode Default**: All styles should default to a sleek dark theme. 
     - **Backgrounds**: Very dark grayish-black (`#0F0F13` or similar).
     - **Surfaces/Cards**: Slightly lighter dark gray (`#1C1C23`).
     - **Accents**: Vibrant purple (`#A855F7` or `#8B5CF6`).
     - **Status/Alerts**: Success green (`#10B981`), Warning/Danger red (`#EF4444`).
   - **Layout Details**: Use large, bold typography for headers and numbers (e.g., Monthly Burn). Utilize horizontal scroll views for prominent upcoming items. Include a persistent "Cycle Progress" horizontal progress bar on active subscription cards.
   - **Form Controls**: Use sleek pill-shaped inputs and toggles, and keep borders to a minimum or very subtle opacity.
   
3. **UI Feedback Strict Rules**
   - **CRITICAL**: Absolutely **NO** native Windows, iOS, or Android system alerts/popups (e.g., `Alert.alert` in React Native).
   - All status updates, errors, successes, and general feedback must be portrayed using **Toasts** via `sonner-native` or custom in-app modals.

4. **Component Standards**
   - **Icons**: Strictly use `lucide-react-native`.
   - **Structure**: Utilize `expo-router` for all navigation needs.
   - **Visual Constraint**: Never use emojis in UI text, toast messages, or system messages. Always use Lucide icons for visual representation to maintain a premium, uniform aesthetic. All icons must use consistent `strokeWidth={2}` and size `20` or `24` depending on context.

## Tools & Utilities

When performing backend or edge logic, follow these utility patterns:
- **Billing Cycle Calculator**: When dealing with subscription dates, calculate exactly how many days remain until the "next billing date" and expose that value clearly to the UI.
- **Trial Guard**: If `isTrial` is true, heavily emphasize the end date and prompt for cancellation 24-48 hours prior to conversion.

Adhere to these rules strictly whenever contributing to the Subb project.
