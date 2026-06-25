FR1:
Problem Statement:
As users interact with the application, they create multiple conversations over time.
However, there is currently no easy way to revisit and continue past chats. This makes it
difficult for users to find previous discussions, resume earlier conversations, and manage
multiple chat threads.

Functional Requirements
The system should:
• Display a sidebar showing a list of past chats.
• Show a short, readable title for each chat.
• Automatically generate the title from the user’s first message (like ChatGPT
does).
• Allow users to click on any chat to open it.

Input
User clicks a particular past conversation
Output That chat opens in the main area


 Constraints
• The sidebar should load within 1 second.
• The sidebar should work properly on standard laptop screens.
• Titles should be short and readable.

Edge Cases & Error Handling:
No chats exist yet (first-time
user)
User clicks a chat that can’t be
loaded
Show message: “No chat history
yet”
Show an error message
First user message is very long Use only the first part as the title

Acceptance Criteria:
The feature is considered complete if:
□ User can see a list of their past chats.
□ The correct conversation is displayed every time.
□ A new chat appears automatically after first use.

FR2:
Add a PII Gaurdrail to the existing ChatGPT application
-This Gaurdrail should block sensitive words like "Passwords", "Credit Crad Number", "SSN"