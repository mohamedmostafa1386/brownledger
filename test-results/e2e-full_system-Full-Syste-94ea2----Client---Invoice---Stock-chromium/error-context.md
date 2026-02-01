# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]: BL
      - heading "Welcome back" [level=1] [ref=e8]
      - paragraph [ref=e9]: Sign in to your BrownLedger account
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email
        - textbox "Email" [ref=e13]:
          - /placeholder: you@example.com
          - text: admin@brownledger.com
      - generic [ref=e14]:
        - generic [ref=e15]: Password
        - textbox "Password" [ref=e16]:
          - /placeholder: ••••••••
          - text: demo123
      - button "Sign In" [ref=e17]
    - paragraph [ref=e18]: "Demo: admin@brownledger.com / demo123"
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]:
    - generic [ref=e27]:
      - text: Rendering
      - generic [ref=e28]:
        - generic [ref=e29]: .
        - generic [ref=e30]: .
        - generic [ref=e31]: .
  - alert [ref=e32]
```