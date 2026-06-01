# Firestore Structure

## users/{uid}
- name
- email
- friendCode
- createdAt

## users/{uid}/friends/{friendUid}
- name
- addedAt

## friendRequests/{id}
- from
- to
- status

## sessions/{id}
- hostId
- participantId
- status
- timerState
- endsAt
- createdAt

## sessionHistory/{id}
- userId
- sessionData
- createdAt