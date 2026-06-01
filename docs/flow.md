# App Core Flow (Pomiastri)

## 1. App Launch
- App starts
- Firebase auth state check

## 2. Auth Decision
- If user NOT logged in → /login
- If user logged in → load profile

## 3. Load User Data
Fetch:
- users/{uid}
- friends list
- active session (if any)

## 4. Home Screen
Show:
- friend code
- stats
- active session button

## 5. Session Flow
If session starts:
- create/update sessions/{id}
- sync timer using endsAt

## 6. Session End
- move data to sessionHistory
- reset active session